import { Injectable, ForbiddenException } from '@nestjs/common';
import { ChatRepository } from '@/modules/chat/chat.repository';
import { FriendshipsRepository } from '@/modules/friendships/friendships.repository';
import { MessageType } from '@/generated/prisma/enums';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class ChatService {
  private readonly redis: Redis;

  constructor(
    private chatRepository: ChatRepository,
    private friendshipsRepository: FriendshipsRepository,
    private config: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.config.getOrThrow('REDIS_HOST'),
      port: this.config.getOrThrow<number>('REDIS_PORT'),
    });
  }

  async getOrCreateConversation(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
      throw new ForbiddenException('Không thể tạo hội thoại với chính mình');
    }

    const areFriends = await this.areFriends(currentUserId, targetUserId);
    if (!areFriends) {
      throw new ForbiddenException('Bạn chỉ có thể nhắn tin với bạn bè');
    }

    const existing = await this.chatRepository.findConversationBetween(
      currentUserId,
      targetUserId,
    );
    if (existing) {
      return {
        conversation: await this.formatConversation(existing, currentUserId),
        wasCreated: false,
      };
    }

    const lockKey = `lock:conv:${[currentUserId, targetUserId].sort().join(':')}`;
    const acquired = await this.redis.set(lockKey, '1', 'EX', 5, 'NX');

    if (!acquired) {
      await new Promise((r) => setTimeout(r, 500));
      const retry = await this.chatRepository.findConversationBetween(
        currentUserId,
        targetUserId,
      );
      if (retry) {
        return {
          conversation: await this.formatConversation(retry, currentUserId),
          wasCreated: false,
        };
      }
      throw new ForbiddenException('Không thể tạo hội thoại, vui lòng thử lại');
    }

    try {
      const conversation = await this.chatRepository.createConversation(
        currentUserId,
        targetUserId,
      );

      return {
        conversation: await this.formatConversation(
          conversation,
          currentUserId,
        ),
        wasCreated: true,
      };
    } finally {
      await this.redis.del(lockKey);
    }
  }

  async getConversations(userId: string) {
    const conversations =
      await this.chatRepository.findConversationsByUserId(userId);

    if (conversations.length === 0) return [];

    const conversationIds = conversations.map((c) => c.id);
    const unreadMap = await this.chatRepository.getUnreadCounts(
      conversationIds,
      userId,
    );

    const otherUserIds = conversations.map((c) => {
      const other = c.participants.find((p) => p.userId !== userId);
      return other!.userId;
    });

    const pipeline = this.redis.pipeline();
    for (const id of otherUserIds) {
      pipeline.sismember('chat:online', id);
    }
    const onlineResults = await pipeline.exec();

    return conversations.map((conv, i) => {
      const otherParticipant = conv.participants.find(
        (p) => p.userId !== userId,
      );
      const lastMessage = conv.messages[0] ?? null;

      return {
        id: conv.id,
        otherUser: otherParticipant!.user,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              type: lastMessage.type,
              senderName: lastMessage.sender.fullname,
              senderId: lastMessage.sender.id,
              createdAt: lastMessage.createdAt,
            }
          : null,
        unreadCount: unreadMap.get(conv.id) ?? 0,
        isOnline: onlineResults?.[i]?.[1] === 1,
        lastMessageAt: conv.lastMessageAt,
      };
    });
  }

  async getMessages(
    conversationId: string,
    userId: string,
    cursor?: string,
    limit = 30,
  ) {
    const isParticipant = await this.chatRepository.isParticipant(
      conversationId,
      userId,
    );
    if (!isParticipant) {
      throw new ForbiddenException('Bạn không thuộc cuộc hội thoại này');
    }

    const messages = await this.chatRepository.findMessages(
      conversationId,
      cursor,
      limit,
    );

    const hasMore = messages.length > limit;
    const sliced = hasMore ? messages.slice(0, limit) : messages;

    const readStatus =
      await this.chatRepository.getParticipantReadStatus(conversationId);

    return {
      data: sliced.map((m) => ({
        ...m,
        conversationId,
      })),
      readStatus,
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    };
  }

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    content?: string;
    type: MessageType;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: string;
    callSessionId?: string;
  }) {
    const message = await this.chatRepository.createMessage(data);
    return { ...message, conversationId: data.conversationId };
  }

  markAsSeen(conversationId: string, userId: string) {
    return this.chatRepository.markAsSeen(conversationId, userId);
  }

  async isParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    return this.chatRepository.isParticipant(conversationId, userId);
  }

  async getUserConversationIds(userId: string): Promise<string[]> {
    return this.chatRepository.getConversationIds(userId);
  }

  async getFriendIds(userId: string): Promise<string[]> {
    const cacheKey = `chat:friends:${userId}`;
    const cached = await this.redis.smembers(cacheKey);
    if (cached.length > 0) return cached;

    const friendIds = await this.friendshipsRepository.getFriendIds(userId);
    if (friendIds.length > 0) {
      await this.redis.sadd(cacheKey, ...friendIds);
      await this.redis.expire(cacheKey, 300);
    }
    return friendIds;
  }

  async isUserOnline(userId: string): Promise<boolean> {
    return (await this.redis.sismember('chat:online', userId)) === 1;
  }

  async setUserOnline(userId: string, socketId: string) {
    const pipeline = this.redis.pipeline();
    pipeline.sadd('chat:online', userId);
    pipeline.sadd(`chat:sockets:${userId}`, socketId);
    await pipeline.exec();
  }

  async setUserOffline(userId: string, socketId: string): Promise<boolean> {
    await this.redis.srem(`chat:sockets:${userId}`, socketId);
    const remaining = await this.redis.scard(`chat:sockets:${userId}`);

    if (remaining === 0) {
      await this.redis.srem('chat:online', userId);
      await this.redis.set(
        `chat:lastActive:${userId}`,
        new Date().toISOString(),
        'EX',
        86400,
      );
      return true;
    }
    return false;
  }

  deleteMessage(messageId: string, userId: string) {
    return this.chatRepository.softDeleteMessage(messageId, userId);
  }

  private async areFriends(userA: string, userB: string): Promise<boolean> {
    const friendship = await this.friendshipsRepository.findBetweenUsers(
      userA,
      userB,
    );
    return friendship?.status === 'ACCEPTED';
  }

  private async formatConversation(
    conversation: {
      id: string;
      createdAt: Date;
      participants: {
        userId: string;
        user: {
          id: string;
          username: string;
          fullname: string | null;
          avatarUrl: string | null;
          lastActiveAt: Date | null;
        };
      }[];
    },
    currentUserId: string,
  ) {
    const otherParticipant = conversation.participants.find(
      (p) => p.userId !== currentUserId,
    );

    const isOnline = otherParticipant
      ? (await this.redis.sismember('chat:online', otherParticipant.userId)) ===
        1
      : false;

    return {
      id: conversation.id,
      otherUser: otherParticipant?.user ?? null,
      isOnline,
      createdAt: conversation.createdAt,
    };
  }
}
