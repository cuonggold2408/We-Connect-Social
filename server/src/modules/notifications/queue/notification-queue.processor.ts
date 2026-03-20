import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import { NotificationRepository } from '@modules/notifications/notifications.repository';
import { NotificationsGateway } from '@modules/notifications/notifications.gateway';
import {
  NotificationEntityType,
  NotificationPayload,
} from '@modules/notifications/events/notifications.events';

@Injectable()
export class NotificationQueueProcessor
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationQueueProcessor.name);
  private worker: Worker;

  constructor(
    private config: ConfigService,
    private notificationRepository: NotificationRepository,
    private notificationsGateway: NotificationsGateway,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      'notifications',
      async (job: Job<NotificationPayload>) => {
        await this.processNotification(job.data);
      },
      {
        connection: {
          host: this.config.getOrThrow('REDIS_HOST'),
          port: this.config.getOrThrow<number>('REDIS_PORT'),
        },
        concurrency: 5,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Notification job ${job?.id} failed: ${err.message}`);
    });
  }

  private async processNotification(payload: NotificationPayload) {
    // Check xem thông báo có trùng lặp không
    const isDuplicate = await this.notificationRepository.existsRecent(
      payload.actorId,
      payload.entityType as NotificationEntityType,
      payload.entityId,
      payload.type,
      5 * 60 * 1000,
    );
    if (isDuplicate) return;

    const notification = await this.notificationRepository.create({
      type: payload.type,
      recipientId: payload.recipientId,
      actorId: payload.actorId,
      entityType: payload.entityType as NotificationEntityType,
      entityId: payload.entityId,
      metadata: payload.metadata,
    });

    this.notificationsGateway.sendToUser(payload.recipientId, {
      notification,
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
