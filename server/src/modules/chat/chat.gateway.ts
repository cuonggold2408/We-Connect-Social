import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  BaseWsExceptionFilter,
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis';
import { ChatService } from '@/modules/chat/chat.service';
import { CHAT_EVENTS } from '@/modules/chat/constants/chat.events';
import type {
  MarkSeenPayload,
  TypingPayload,
} from '@/modules/chat/constants/chat.events';
import {
  authenticateSocket,
  revalidateToken,
} from '@/shared/websocket/ws-auth.helper';
import { WsRateLimiter } from '@/shared/websocket/ws-rate-limiter';
import { SendMessageDto } from '@/modules/chat/dto/send-message.dto';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private readonly redis: Redis;
  private readonly rateLimiter: WsRateLimiter;
  private readonly jwtSecret: string;

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private chatService: ChatService,
  ) {
    this.redis = new Redis({
      host: this.config.getOrThrow('REDIS_HOST'),
      port: this.config.getOrThrow<number>('REDIS_PORT'),
    });
    this.rateLimiter = new WsRateLimiter(this.redis);
    this.jwtSecret = this.config.getOrThrow('JWT_ACCESS_SECRET');
  }

  async handleConnection(client: Socket) {
    try {
      const userId = await authenticateSocket(
        client,
        this.jwtService,
        this.jwtSecret,
      );
      client.data.userId = userId;

      await client.join(`user:${userId}`);
      await this.chatService.setUserOnline(userId, client.id);

      const conversationIds =
        await this.chatService.getUserConversationIds(userId);
      for (const id of conversationIds) {
        await client.join(`conversation:${id}`);
      }

      const friendIds = await this.chatService.getFriendIds(userId);
      for (const friendId of friendIds) {
        this.server
          .to(`user:${friendId}`)
          .emit(CHAT_EVENTS.USER_ONLINE, { userId });
      }

      this.logger.log(`Chat: User ${userId} connected (${client.id})`);
    } catch {
      this.logger.warn(`Chat: Unauthorized socket ${client.id}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.data.userId as string;
    if (!userId) return;

    const isFullyOffline = await this.chatService.setUserOffline(
      userId,
      client.id,
    );

    if (isFullyOffline) {
      const friendIds = await this.chatService.getFriendIds(userId);
      for (const friendId of friendIds) {
        this.server
          .to(`user:${friendId}`)
          .emit(CHAT_EVENTS.USER_OFFLINE, { userId });
      }
    }

    this.logger.log(`Chat: User ${userId} disconnected (${client.id})`);
  }

  @SubscribeMessage(CHAT_EVENTS.SEND_MESSAGE)
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors
          .flatMap((e) => Object.values(e.constraints ?? {}))
          .join('; ');
        return new WsException(messages || 'Payload không hợp lệ');
      },
    }),
  )
  @UseFilters(new BaseWsExceptionFilter())
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    const senderId = client.data.userId as string;

    try {
      await revalidateToken(client, this.jwtService, this.jwtSecret);

      const allowed = await this.rateLimiter.check(
        senderId,
        'send-message',
        30,
        10,
      );
      if (!allowed) {
        client.emit(CHAT_EVENTS.MESSAGE_ERROR, {
          tempId: payload.tempId,
          error: 'Bạn gửi tin nhắn quá nhanh, vui lòng chờ',
        });
        return;
      }

      const idemKey = `chat:idem:${senderId}:${payload.tempId}`;
      const acquired = await this.redis.set(idemKey, '1', 'EX', 60, 'NX');
      if (!acquired) {
        const cachedId = await this.redis.get(`${idemKey}:mid`);
        if (cachedId) {
          client.emit(CHAT_EVENTS.MESSAGE_ACK, {
            tempId: payload.tempId,
            message: { id: cachedId, duplicated: true },
          });
        }
        return;
      }

      const isParticipant = await this.chatService.isParticipant(
        payload.conversationId,
        senderId,
      );
      if (!isParticipant) {
        await this.redis.del(idemKey);
        client.emit(CHAT_EVENTS.MESSAGE_ERROR, {
          tempId: payload.tempId,
          error: 'Bạn không thuộc cuộc hội thoại này',
        });
        return;
      }

      const message = await this.chatService.createMessage({
        conversationId: payload.conversationId,
        senderId,
        content: payload.content?.trim(),
        type: payload.type ?? 'TEXT',
        fileUrl: payload.fileUrl,
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        replyToId: payload.replyToId,
      });

      await this.redis.set(`${idemKey}:mid`, message.id, 'EX', 60);

      client.emit(CHAT_EVENTS.MESSAGE_ACK, {
        tempId: payload.tempId,
        message,
      });

      client
        .to(`conversation:${payload.conversationId}`)
        .emit(CHAT_EVENTS.NEW_MESSAGE, { message });

      this.server
        .to(`conversation:${payload.conversationId}`)
        .emit(CHAT_EVENTS.CONVERSATION_UPDATED, {
          conversationId: payload.conversationId,
          lastMessage: {
            id: message.id,
            content: message.content,
            type: message.type,
            senderName: message.sender.fullname,
            senderId: message.sender.id,
            createdAt: message.createdAt,
          },
        });
    } catch (error: any) {
      if (error.message === 'Token expired') return;

      this.logger.error(`Send message failed: ${error.message}`, error.stack);
      client.emit(CHAT_EVENTS.MESSAGE_ERROR, {
        tempId: payload?.tempId,
        error: 'Gửi tin nhắn thất bại, vui lòng thử lại',
      });
    }
  }

  @SubscribeMessage(CHAT_EVENTS.MARK_SEEN)
  async handleMarkSeen(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: MarkSeenPayload,
  ) {
    const userId = client.data.userId as string;

    try {
      await this.chatService.markAsSeen(payload.conversationId, userId);

      client
        .to(`conversation:${payload.conversationId}`)
        .emit(CHAT_EVENTS.MESSAGES_SEEN, {
          conversationId: payload.conversationId,
          userId,
          seenAt: new Date().toISOString(),
        });
    } catch (error: any) {
      this.logger.error(`Mark seen failed: ${error.message}`);
    }
  }

  @SubscribeMessage(CHAT_EVENTS.TYPING)
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const userId = client.data.userId as string;

    const allowed = await this.rateLimiter.check(
      `${userId}:${payload.conversationId}`,
      'typing',
      1,
      2,
    );
    if (!allowed) return;

    client
      .to(`conversation:${payload.conversationId}`)
      .emit(CHAT_EVENTS.USER_TYPING, {
        conversationId: payload.conversationId,
        userId,
      });
  }

  @SubscribeMessage(CHAT_EVENTS.STOP_TYPING)
  handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const userId = client.data.userId as string;

    client
      .to(`conversation:${payload.conversationId}`)
      .emit(CHAT_EVENTS.USER_STOP_TYPING, {
        conversationId: payload.conversationId,
        userId,
      });
  }

  joinUserToConversation(userId: string, conversationId: string) {
    this.server
      .in(`user:${userId}`)
      .socketsJoin(`conversation:${conversationId}`);
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return this.chatService.isUserOnline(userId);
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }
}
