import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

@Injectable()
export class CounterQueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CounterQueueService.name);

  readonly redis: Redis;
  private readonly flushQueue: Queue;

  readonly pendingSetKey = 'counter:pending_posts';
  counterKey(postId: string, field: string) {
    return `counter:${postId}:${field}`;
  }

  constructor(private configService: ConfigService) {
    const redisConfig = {
      host: this.configService.getOrThrow('REDIS_HOST'),
      port: this.configService.getOrThrow<number>('REDIS_PORT'),
    };

    this.redis = new Redis(redisConfig);

    this.flushQueue = new Queue('counter-flush', {
      connection: redisConfig,
    });
  }

  async onModuleInit() {
    await this.flushQueue.upsertJobScheduler(
      'flush-counters',
      { every: 5000 },
      {
        name: 'flush-counters',
        opts: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 1000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      },
    );
    this.logger.log('Counter flush scheduler registered (every 5s)');
  }

  async incrementCounter(
    postId: string,
    field: 'reactionCount' | 'commentCount',
    delta: number,
  ): Promise<void> {
    const key = this.counterKey(postId, field);

    const pipeline = this.redis.pipeline();
    pipeline.incrby(key, delta);
    pipeline.sadd(this.pendingSetKey, postId);
    await pipeline.exec();

    this.logger.debug(
      `Redis ${field} ${delta > 0 ? '+' : ''}${delta} for post ${postId}`,
    );
  }

  async popPendingPostIds(count: number = 1000): Promise<string[]> {
    const result = await this.redis.spop(this.pendingSetKey, count);
    if (!result) return [];
    return Array.isArray(result) ? result : [result];
  }

  async getAndResetCounter(postId: string, field: string): Promise<number> {
    const key = this.counterKey(postId, field);
    const value = await this.redis.getdel(key);
    return parseInt(value || '0', 10);
  }

  async onModuleDestroy() {
    await this.flushQueue.close();
    await this.redis.quit();
  }
}
