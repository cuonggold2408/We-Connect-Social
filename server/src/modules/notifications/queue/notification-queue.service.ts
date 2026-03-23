import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import {
  AggregationJobData,
  NotificationPayload,
} from '@modules/notifications/events/notifications.events';
import Redis from 'ioredis';

const AGGREGATION_DELAY_MS = 10000;
const BUFFER_TTL_SECONDS = 30;

@Injectable()
export class NotificationQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly queue: Queue;
  private readonly redis: Redis;

  constructor(private config: ConfigService) {
    const connection = {
      host: config.getOrThrow('REDIS_HOST'),
      port: config.getOrThrow<number>('REDIS_PORT'),
    };

    this.queue = new Queue('notifications', {
      connection,
    });
    this.redis = new Redis(connection);
  }

  private bufferKey(recipientId: string, type: string, entityId: string) {
    return `notification:agg:${recipientId}:${type}:${entityId}`;
  }

  async addAggregationJob(payload: NotificationPayload) {
    const key = this.bufferKey(
      payload.recipientId,
      payload.type,
      payload.entityId,
    );
    await this.redis.sadd(key, payload.actorId);
    await this.redis.expire(key, BUFFER_TTL_SECONDS);
    const jobId = `agg-${payload.recipientId}-${payload.type}-${payload.entityId}`;
    await this.queue.add(
      'aggregate-notification',
      {
        recipientId: payload.recipientId,
        type: payload.type,
        entityType: payload.entityType,
        entityId: payload.entityId,
        bufferKey: key,
        metadata: payload.metadata,
      } as AggregationJobData,
      {
        delay: AGGREGATION_DELAY_MS,
        jobId,
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    );
  }
  async addImmediateJob(payload: NotificationPayload) {
    await this.queue.add('send-notification', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    });
  }

  async onModuleInit() {}
  async onModuleDestroy() {
    await this.queue.close();
  }
}
