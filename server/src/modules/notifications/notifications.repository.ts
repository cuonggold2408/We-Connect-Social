import { NotificationType } from '@/generated/prisma/enums';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import {
  ActorSnapshot,
  NotificationEntityType,
} from '@/modules/notifications/events/notifications.events';
import { Prisma } from '@/generated/prisma/client';

const ACTOR_SELECT = {
  id: true,
  username: true,
  fullname: true,
  avatarUrl: true,
} as const;

@Injectable()
export class NotificationRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    type: NotificationType;
    recipientId: string;
    actorId: string;
    entityType: NotificationEntityType;
    entityId: string;
    metadata?: Prisma.InputJsonObject;
  }) {
    const notification = await this.prisma.notification.create({
      data,
      include: {
        actor: {
          select: ACTOR_SELECT,
        },
      },
    });

    return notification;
  }

  async upsertAggregated(data: {
    recipientId: string;
    type: NotificationType;
    entityType: string;
    entityId: string;
    latestActorId: string;
    newActorCount: number;
    metadata: Prisma.InputJsonObject;
  }) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.notification.findFirst({
        where: {
          recipientId: data.recipientId,
          type: data.type,
          entityId: data.entityId,
        },
      });

      if (existing) {
        return tx.notification.update({
          where: { id: existing.id },
          data: {
            actorId: data.latestActorId,
            actorCount: existing.actorCount + data.newActorCount,
            metadata: data.metadata,
            isRead: false,
            createdAt: new Date(),
          },
          include: { actor: { select: ACTOR_SELECT } },
        });
      }

      return tx.notification.create({
        data: {
          type: data.type,
          recipientId: data.recipientId,
          actorId: data.latestActorId,
          entityType: data.entityType,
          entityId: data.entityId,
          actorCount: data.newActorCount,
          metadata: data.metadata,
        },
        include: { actor: { select: ACTOR_SELECT } },
      });
    });
  }

  async findActorsByIds(ids: string[]): Promise<ActorSnapshot[]> {
    return this.prisma.user.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: ACTOR_SELECT,
    });
  }

  async findByRecipient(recipientId: string, cursor?: string, limit = 20) {
    return this.prisma.notification.findMany({
      where: {
        recipientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit + 1,
      ...(cursor && {
        cursor: {
          id: cursor,
        },
        skip: 1,
      }),
      include: {
        actor: {
          select: {
            id: true,
            username: true,
            fullname: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async countUnread(recipientId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        recipientId,
        isRead: false,
      },
    });
  }

  async markAsRead(recipientId: string, ids: string[]) {
    return this.prisma.notification.updateMany({
      where: {
        recipientId,
        id: {
          in: ids,
        },
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(recipientId: string) {
    return this.prisma.notification.updateMany({
      where: {
        recipientId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async findAggregated(
    recipientId: string,
    type: NotificationType,
    entityId: string,
  ) {
    return this.prisma.notification.findFirst({
      where: { recipientId, type, entityId },
    });
  }
}
