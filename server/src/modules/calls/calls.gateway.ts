import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { CallsService } from '@/modules/calls/calls.service';
import { ChatGateway } from '@/modules/chat/chat.gateway';
import { CALL_EVENTS } from '@/modules/calls/constants/call.events';
import type {
  CallInitiatePayload,
  WebRTCSignalPayload,
} from '@/modules/calls/constants/call.events';
import { authenticateSocket } from '@/shared/websocket/ws-auth.helper';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  namespace: '/call',
})
export class CallsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(CallsGateway.name);
  private readonly jwtSecret: string;

  private activeCallSockets = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
    private callsService: CallsService,
    private chatGateway: ChatGateway,
  ) {
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
      this.logger.log(`Call: User ${userId} connected (${client.id})`);
    } catch {
      this.logger.warn(`Call: Unauthorized socket ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string;
    if (!userId) return;

    const callSessionId = this.activeCallSockets.get(client.id);
    if (callSessionId) {
      this.activeCallSockets.delete(client.id);

      setTimeout(() => {
        void (async () => {
          try {
            const sockets = await this.server
              .in(`call:${callSessionId}`)
              .fetchSockets();
            const stillInCall = sockets.some(
              (s) => (s.data as { userId?: string }).userId === userId,
            );
            if (stillInCall) return;

            const session = await this.callsService.endCall(
              callSessionId,
              'ENDED',
              'disconnect',
            );
            if (!session) return;

            const otherUserId =
              session.callerId === userId ? session.calleeId : session.callerId;

            if ('callLogMessage' in session) {
              this.chatGateway.sendToUser(userId, 'new-message', {
                message: {
                  ...session.callLogMessage,
                  conversationId: session.conversationId,
                },
              });
              this.chatGateway.sendToUser(otherUserId, 'new-message', {
                message: {
                  ...session.callLogMessage,
                  conversationId: session.conversationId,
                },
              });
            }

            this.server.to(`user:${otherUserId}`).emit(CALL_EVENTS.CALL_ENDED, {
              callSessionId,
              duration: session.duration,
              reason: 'disconnect',
            });
          } catch (error: any) {
            this.logger.error(
              `Call disconnect cleanup failed: ${error.message}`,
            );
          }
        })();
      }, 5000);
    }

    this.logger.log(`Call: User ${userId} disconnected (${client.id})`);
  }

  @SubscribeMessage(CALL_EVENTS.CALL_INITIATE)
  async handleCallInitiate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CallInitiatePayload,
  ) {
    const callerId = client.data.userId as string;

    try {
      const isCalleeOnline = await this.chatGateway.isUserOnline(
        payload.calleeId,
      );
      if (!isCalleeOnline) {
        client.emit(CALL_EVENTS.CALL_ENDED, {
          reason: 'Người dùng không trực tuyến',
        });
        return;
      }

      const result = await this.callsService.initiateCall({
        conversationId: payload.conversationId,
        callerId,
        calleeId: payload.calleeId,
        type: payload.type as any,
      });

      if ('busy' in result) {
        client.emit(CALL_EVENTS.CALL_BUSY, { calleeId: payload.calleeId });
        return;
      }

      const { callSession } = result;
      this.activeCallSockets.set(client.id, callSession.id);
      await client.join(`call:${callSession.id}`);

      this.server
        .to(`user:${payload.calleeId}`)
        .emit(CALL_EVENTS.INCOMING_CALL, { callSession });

      client.emit(CALL_EVENTS.CALL_INITIATED, { callSession });
    } catch (error: any) {
      this.logger.error(`Call initiate failed: ${error.message}`);
      client.emit(CALL_EVENTS.CALL_ENDED, { reason: 'Lỗi hệ thống' });
    }
  }

  @SubscribeMessage(CALL_EVENTS.CALL_ACCEPT)
  async handleCallAccept(
    @ConnectedSocket() client: Socket,
    @MessageBody() { callSessionId }: { callSessionId: string },
  ) {
    try {
      this.activeCallSockets.set(client.id, callSessionId);
      await client.join(`call:${callSessionId}`);

      const session = await this.callsService.acceptCall(callSessionId);

      this.server
        .to(`user:${session.callerId}`)
        .emit(CALL_EVENTS.CALL_ACCEPTED, { callSession: session });
    } catch (error: any) {
      this.logger.error(`Call accept failed: ${error.message}`);
    }
  }

  @SubscribeMessage(CALL_EVENTS.CALL_REJECT)
  async handleCallReject(
    @ConnectedSocket() _client: Socket,
    @MessageBody() { callSessionId }: { callSessionId: string },
  ) {
    try {
      const session = await this.callsService.rejectCall(callSessionId);
      if (session) {
        this.server
          .to(`user:${session.callerId}`)
          .emit(CALL_EVENTS.CALL_REJECTED, { callSessionId });
      }
    } catch (error: any) {
      this.logger.error(`Call reject failed: ${error.message}`);
    }
  }

  @SubscribeMessage(CALL_EVENTS.CALL_END)
  async handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() { callSessionId }: { callSessionId: string },
  ) {
    const userId = client.data.userId as string;
    this.activeCallSockets.delete(client.id);

    try {
      const session = await this.callsService.endCall(callSessionId);
      if (!session) return;

      const otherUserId =
        session.callerId === userId ? session.calleeId : session.callerId;

      if ('callLogMessage' in session) {
        this.chatGateway.sendToUser(userId, 'new-message', {
          message: {
            ...session.callLogMessage,
            conversationId: session.conversationId,
          },
        });
        this.chatGateway.sendToUser(otherUserId, 'new-message', {
          message: {
            ...session.callLogMessage,
            conversationId: session.conversationId,
          },
        });
      }

      for (const [socketId, csId] of this.activeCallSockets.entries()) {
        if (csId === callSessionId) {
          this.activeCallSockets.delete(socketId);
        }
      }

      this.server.to(`user:${otherUserId}`).emit(CALL_EVENTS.CALL_ENDED, {
        callSessionId,
        duration: session.duration,
      });
    } catch (error: any) {
      this.logger.error(`Call end failed: ${error.message}`);
    }
  }

  @SubscribeMessage(CALL_EVENTS.WEBRTC_OFFER)
  handleWebRTCOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WebRTCSignalPayload,
  ) {
    client.to(`call:${payload.callSessionId}`).emit(CALL_EVENTS.WEBRTC_OFFER, {
      sdp: payload.sdp,
      callSessionId: payload.callSessionId,
    });
  }

  @SubscribeMessage(CALL_EVENTS.WEBRTC_ANSWER)
  handleWebRTCAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WebRTCSignalPayload,
  ) {
    client.to(`call:${payload.callSessionId}`).emit(CALL_EVENTS.WEBRTC_ANSWER, {
      sdp: payload.sdp,
      callSessionId: payload.callSessionId,
    });
  }

  @SubscribeMessage(CALL_EVENTS.WEBRTC_ICE_CANDIDATE)
  handleICECandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: WebRTCSignalPayload,
  ) {
    client
      .to(`call:${payload.callSessionId}`)
      .emit(CALL_EVENTS.WEBRTC_ICE_CANDIDATE, {
        candidate: payload.candidate,
        callSessionId: payload.callSessionId,
      });
  }

  private broadcastCallEnded(userId: string, callSessionId: string) {
    this.server
      .to(`call:${callSessionId}`)
      .emit(CALL_EVENTS.CALL_ENDED, { callSessionId, reason: 'disconnect' });
  }
}
