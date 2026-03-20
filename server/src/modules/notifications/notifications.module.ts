import { Module } from '@nestjs/common';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { NotificationsController } from '@modules/notifications/notifications.controller';
import { NotificationRepository } from '@modules/notifications/notifications.repository';
import { NotificationsGateway } from '@modules/notifications/notifications.gateway';
import { NotificationListener } from '@modules/notifications/events/notifications.listener';
import { NotificationQueueService } from '@modules/notifications/queue/notification-queue.service';
import { NotificationQueueProcessor } from '@modules/notifications/queue/notification-queue.processor';
import { PrismaModule } from '@/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationRepository,
    NotificationsGateway,
    NotificationListener,
    NotificationQueueService,
    NotificationQueueProcessor,
  ],
})
export class NotificationsModule {}
