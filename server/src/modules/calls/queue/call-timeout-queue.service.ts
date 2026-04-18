import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';

@Injectable()
export class CallTimeoutQueueService implements OnModuleDestroy {
  private readonly queue: Queue;
  private readonly logger = new Logger(CallTimeoutQueueService.name);

  constructor(private config: ConfigService) {
    this.queue = new Queue('call-timeout', {
      connection: {
        host: config.getOrThrow('REDIS_HOST'),
        port: config.getOrThrow<number>('REDIS_PORT'),
      },
    });
  }

  async scheduleTimeout(callSessionId: string, delayMs = 30000) {
    await this.queue.add(
      'timeout',
      { callSessionId },
      {
        delay: delayMs,
        jobId: `call-timeout-${callSessionId}`,
        removeOnComplete: true,
        removeOnFail: 50,
      },
    );
  }

  async cancelTimeout(callSessionId: string) {
    try {
      const job = await this.queue.getJob(`timeout:${callSessionId}`);
      if (job) await job.remove();
    } catch {
      this.logger.error(
        `Failed to cancel timeout for call session ${callSessionId}`,
      );
    }
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}
