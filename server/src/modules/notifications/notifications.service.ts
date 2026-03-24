import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '@modules/notifications/notifications.repository';
import { NotificationsGateway } from '@modules/notifications/notifications.gateway';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import {
  ActorSnapshot,
  AggregationJobData,
  NotificationEntityType,
  NotificationPayload,
} from '@modules/notifications/events/notifications.events';
import { NotificationType, Prisma } from '@/generated/prisma/client';

export interface GetNotificationsResult {
  data: Array<{
    id: string;
    type: NotificationType;
    entityType: NotificationEntityType;
    entityId: string;
    actors: ActorSnapshot[];
    actorCount: number;
    metadata: unknown;
    isRead: boolean;
    createdAt: Date;
    notificationIds: string[];
  }>;
  nextCursor: string | null;
}

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

  private cleanMetadata(
    meta: Prisma.InputJsonObject | null,
  ): Record<string, unknown> | null {
    if (!meta) return null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { actors, ...rest } = meta;
    return Object.keys(rest).length > 0 ? rest : null;
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
      actors: [notification.actor],
      actorCount: 1,
      entityType: notification.entityType,
      entityId: notification.entityId,
      metadata: notification.metadata as Record<string, any>,
      isRead: false,
      createdAt: notification.createdAt,
    });

    this.notificationsGateway.sendUnreadCount(payload.recipientId, unreadCount);
  }

  async processAggregation(data: AggregationJobData): Promise<void> {
    const tempKey = `${data.bufferKey}:processing`;
    try {
      await this.redis.rename(data.bufferKey, tempKey);
    } catch {
      return;
    }

    const actorIds = await this.redis.smembers(tempKey);
    if (actorIds.length === 0) {
      await this.redis.del(tempKey);
      return;
    }

    const newActors =
      await this.notificationsRepository.findActorsByIds(actorIds);
    const latestActorId = actorIds[actorIds.length - 1];

    const existingNotification =
      await this.notificationsRepository.findAggregated(
        data.recipientId,
        data.type,
        data.entityId,
      );
    const existingActors: ActorSnapshot[] =
      (existingNotification?.metadata as any)?.actors ?? [];

    const mergedActors = this.mergeActors(newActors, existingActors);

    const existingActorIds = new Set(existingActors.map((a) => a.id));
    const trulyNewCount = actorIds.filter(
      (id) => !existingActorIds.has(id),
    ).length;

    const notification = await this.notificationsRepository.upsertAggregated({
      recipientId: data.recipientId,
      type: data.type,
      entityType: data.entityType,
      entityId: data.entityId,
      latestActorId,
      newActorCount: trulyNewCount,
      metadata: {
        ...data.metadata,
        actors: mergedActors as unknown as Prisma.InputJsonObject,
      },
    });
    await this.redis.del(tempKey);
    const unreadCount = await this.refreshUnreadCount(data.recipientId);
    this.notificationsGateway.sendNotification(data.recipientId, {
      id: notification.id,
      type: notification.type,
      actors: mergedActors,
      actorCount: notification.actorCount,
      entityType: notification.entityType,
      entityId: notification.entityId,
      metadata: data.metadata as Record<string, any>,
      isRead: false,
      createdAt: notification.createdAt,
    });
    this.notificationsGateway.sendUnreadCount(data.recipientId, unreadCount);
  }
  private mergeActors(
    newActors: ActorSnapshot[],
    existingActors: ActorSnapshot[],
  ): ActorSnapshot[] {
    const seen = new Set<string>();
    const merged: ActorSnapshot[] = [];

    for (const actor of [...newActors, ...existingActors]) {
      if (seen.has(actor.id)) continue;
      seen.add(actor.id);
      merged.push(actor);
      if (merged.length >= 3) break;
    }
    return merged;
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
      data: sliced.map((n) => {
        const meta = n.metadata as Record<string, any> | null;
        const actors: ActorSnapshot[] =
          n.actorCount > 1 ? (meta?.actors ?? [n.actor]) : [n.actor];
        return {
          id: n.id,
          type: n.type,
          actors,
          actorCount: n.actorCount,
          entityType: n.entityType,
          entityId: n.entityId,
          metadata: this.cleanMetadata(meta),
          isRead: n.isRead,
          createdAt: n.createdAt,
        };
      }),
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cached = await this.redis.get(this.unreadCacheKey(userId));
    if (cached !== null) return parseInt(cached, 10);
    return this.refreshUnreadCount(userId);
  }

  async markAsRead(userId: string, ids: string[]) {
    await this.notificationsRepository.markAsRead(userId, ids);
    const newCount = await this.refreshUnreadCount(userId);
    this.notificationsGateway.sendUnreadCount(userId, newCount);
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepository.markAllAsRead(userId);
    await this.redis.set(this.unreadCacheKey(userId), 0, 'EX', 60);
    this.notificationsGateway.sendUnreadCount(userId, 0);
    return { success: true };
  }
}
