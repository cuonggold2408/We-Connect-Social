import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '@modules/notifications/notifications.repository';
import { NotificationsGateway } from '@modules/notifications/notifications.gateway';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  NotificationEntityType,
  NotificationPayload,
  NotificationSocketData,
} from '@modules/notifications/events/notifications.events';

@Injectable()
export class NotificationsService {
  private readonly redis: Redis;

  constructor(
    private notificationsRepository: NotificationRepository,
    private notificationsGateway: NotificationsGateway,
    private config: ConfigService,
  ) {
    this.redis = new Redis({
      host: this.config.getOrThrow('REDIS_HOST'),
      port: this.config.getOrThrow<number>('REDIS_PORT'),
    });
  }

  private unreadCacheKey(userId: string) {
    return `notification:unread:${userId}`;
  }

  private dedupKey(payload: NotificationPayload) {
    return `notification:dedup:${payload.actorId}:${payload.entityType}:${payload.entityId}:${payload.type}`;
  }

  private async refreshUnreadCount(userId: string): Promise<number> {
    const count = await this.notificationsRepository.countUnread(userId);
    await this.redis.set(this.unreadCacheKey(userId), count, 'EX', 60);

    return count;
  }

  async createAndNotify(payload: NotificationPayload): Promise<void> {
    const isNew = await this.redis.set(
      this.dedupKey(payload),
      '1',
      'EX',
      5 * 60,
      'NX',
    );

    if (!isNew) return;

    const notification = await this.notificationsRepository.create({
      type: payload.type,
      recipientId: payload.recipientId,
      actorId: payload.actorId,
      entityType: payload.entityType as NotificationEntityType,
      entityId: payload.entityId,
      metadata: payload.metadata,
    });

    const unreadCount = await this.refreshUnreadCount(payload.recipientId);

    this.notificationsGateway.sendNotification(payload.recipientId, {
      id: notification.id,
      type: notification.type,
      actor: notification.actor,
      entityType: notification.entityType,
      entityId: notification.entityId,
      metadata: notification.metadata,
      isRead: notification.isRead,
    } as NotificationSocketData);

    this.notificationsGateway.sendUnreadCount(payload.recipientId, unreadCount);
  }

  async getNotifications(userId: string, cursor?: string, limit = 20) {
    const notifications = await this.notificationsRepository.findByRecipient(
      userId,
      cursor,
      limit,
    );

    const hasMore = notifications.length > limit;
    const sliced = hasMore ? notifications.slice(0, limit) : notifications;

    return {
      data: sliced.map((n) => ({
        id: n.id,
        type: n.type,
        actor: n.actor,
        entityType: n.entityType,
        entityId: n.entityId,
        metadata: n.metadata,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = this.unreadCacheKey(userId);

    const cached = await this.redis.get(cacheKey);
    if (cached !== null) return parseInt(cached, 10);

    const count = await this.notificationsRepository.countUnread(userId);
    await this.redis.set(cacheKey, count, 'EX', 60);
    return count;
  }

  async incrementUnreadCache(userId: string) {
    const key = this.unreadCacheKey(userId);
    const exists = await this.redis.exists(key);
    if (exists) {
      await this.redis.incr(key);
    }
  }

  async markAsRead(userId: string, ids: string[]) {
    await this.notificationsRepository.markAsRead(userId, ids);
    await this.redis.del(this.unreadCacheKey(userId));

    const newCount = await this.notificationsRepository.countUnread(userId);
    this.notificationsGateway.sendUnreadCount(userId, newCount);

    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepository.markAllAsRead(userId);
    await this.redis.del(this.unreadCacheKey(userId));

    this.notificationsGateway.sendUnreadCount(userId, 0);

    return { success: true };
  }
}
