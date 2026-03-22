import { NotificationType } from '@/generated/prisma/enums';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { NotificationEntityType } from '@/modules/notifications/events/notifications.events';
import { Prisma } from '@/generated/prisma/client';

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
          select: {
            id: true,
            username: true,
            fullname: true,
            avatarUrl: true,
          },
        },
      },
    });

    return notification;
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
}
