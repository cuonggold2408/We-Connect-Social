import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';

import {
  AggregationJobData,
  NotificationPayload,
} from '@modules/notifications/events/notifications.events';
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
      async (job: Job) => {
        switch (job.name) {
          case 'send-notification':
            await this.notificationsService.createAndNotify(
              job.data as NotificationPayload,
            );
            break;
          case 'aggregate-notification':
            await this.notificationsService.processAggregation(
              job.data as AggregationJobData,
            );
            break;
        }
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
      this.logger.error(
        `Notification job [${job?.name}] ${job?.id} failed: ${err.message}`,
      );
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
