import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { NotificationPayload } from '@modules/notifications/events/notifications.events';

@Injectable()
export class NotificationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly queue: Queue;

  constructor(private config: ConfigService) {
    this.queue = new Queue('notifications', {
      connection: {
        host: config.getOrThrow('REDIS_HOST'),
        port: config.getOrThrow<number>('REDIS_PORT'),
      },
    });
  }

  async addJob(payload: NotificationPayload) {
    await this.queue.add('send-notification', payload, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
  }

  async onModuleInit() {}
  async onModuleDestroy() {
    await this.queue.close();
  }
}
