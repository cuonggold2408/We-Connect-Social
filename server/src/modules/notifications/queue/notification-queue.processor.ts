import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';

import { NotificationPayload } from '@modules/notifications/events/notifications.events';
import { NotificationsService } from '@modules/notifications/notifications.service';

@Injectable()
export class NotificationQueueProcessor
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(NotificationQueueProcessor.name);
  private worker: Worker;

  constructor(
    private config: ConfigService,
    private notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      'notifications',
      async (job: Job<NotificationPayload>) => {
        await this.notificationsService.createAndNotify(job.data);
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

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
