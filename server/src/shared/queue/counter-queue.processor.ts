import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Worker } from 'bullmq';
import { PrismaService } from '@shared/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { CounterQueueService } from './counter-queue.service';

@Injectable()
export class CounterQueueProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CounterQueueProcessor.name);
  private worker: Worker;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private counterQueue: CounterQueueService,
  ) {}

  onModuleInit() {
    const redisConfig = {
      host: this.configService.getOrThrow('REDIS_HOST'),
      port: this.configService.getOrThrow<number>('REDIS_PORT'),
    };

    this.worker = new Worker(
      'counter-flush',
      async () => {
        await this.flushToDatabase();
      },
      {
        connection: redisConfig,
        concurrency: 1,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Flush job ${job?.id} failed: ${err.message}`);
    });

    this.logger.log('Counter flush worker started');
  }

  private readonly BATCH_SIZE = 50;

  private async flushToDatabase() {
    const pendingPostIds = await this.counterQueue.popPendingPostIds(1000);
    if (pendingPostIds.length === 0) return;

    this.logger.debug(`Flushing counters for ${pendingPostIds.length} posts`);
    const errors: string[] = [];

    for (let i = 0; i < pendingPostIds.length; i += this.BATCH_SIZE) {
      const chunk = pendingPostIds.slice(i, i + this.BATCH_SIZE);

      const updatePromises = chunk.map(async (postId) => {
        const reactionDelta = await this.counterQueue.getAndResetCounter(
          postId,
          'reactionCount',
        );
        const commentDelta = await this.counterQueue.getAndResetCounter(
          postId,
          'commentCount',
        );

        if (reactionDelta === 0 && commentDelta === 0) return;

        try {
          await this.prisma.post.update({
            where: { id: postId },
            data: {
              ...(reactionDelta !== 0 && {
                reactionCount: { increment: reactionDelta },
              }),
              ...(commentDelta !== 0 && {
                commentCount: { increment: commentDelta },
              }),
            },
          });
        } catch (error) {
          this.logger.error(`Failed to flush post ${postId}`, error);
          errors.push(postId);

          const pipeline = this.counterQueue.redis.pipeline();
          if (reactionDelta !== 0) {
            pipeline.incrby(
              this.counterQueue.counterKey(postId, 'reactionCount'),
              reactionDelta,
            );
          }
          if (commentDelta !== 0) {
            pipeline.incrby(
              this.counterQueue.counterKey(postId, 'commentCount'),
              commentDelta,
            );
          }
          pipeline.sadd(this.counterQueue.pendingSetKey, postId);
          await pipeline.exec();
        }
      });

      await Promise.allSettled(updatePromises);
    }

    if (errors.length > 0) {
      throw new Error(
        `Flush failed for ${errors.length} posts. Data restored to Redis.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
