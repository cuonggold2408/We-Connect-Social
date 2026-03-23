import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as cookie from 'cookie';
import { NotificationSocketData } from '@modules/notifications/events/notifications.events';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      let token: string | undefined;

      const cookieHeader = client.handshake.headers.cookie;
      if (cookieHeader) {
        const cookies = cookie.parse(cookieHeader);
        token = cookies['access_token'];
      }

      if (!token) {
        token = client.handshake.headers.access_token as string;
      }

      if (!token) {
        throw new Error('Token is missing');
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
      });

      const userId = payload.sub as string;
      client.data.userId = userId;

      await client.join(`user:${userId}`);

      this.logger.log(`User ${userId} connected (socket: ${client.id})`);
    } catch {
      this.logger.warn(`Unauthorized socket: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string;
    if (userId) {
      this.logger.log(`User ${userId} disconnected (socket: ${client.id})`);
    }
  }

  sendNotification(userId: string, data: NotificationSocketData) {
    this.server.to(`user:${userId}`).emit('new-notification', data);
  }

  sendUnreadCount(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit('unread-count', { count });
  }
}
