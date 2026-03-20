import { Injectable } from '@nestjs/common';
import { NotificationRepository } from './notifications.repository';
import { NotificationsGateway } from './notifications.gateway';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class NotificationsService {
  private readonly redis: Redis;

  private unreadCacheKey(userId: string) {
    return `notification:unread:${userId}`;
  }

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
        createdAt: n.createAt,
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
