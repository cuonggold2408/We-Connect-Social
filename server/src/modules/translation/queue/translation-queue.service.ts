import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { TranslatableEntity } from '@/generated/prisma/enums';

export interface PretranslateJob {
  entityType: TranslatableEntity;
  entityId: string;
  text: string;
  targetLangs: string[];
}

@Injectable()
export class TranslationQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(TranslationQueueService.name);
  private readonly queue: Queue;

  constructor(config: ConfigService) {
    this.queue = new Queue('translation-pretranslate', {
      connection: {
        host: config.getOrThrow('REDIS_HOST'),
        port: config.getOrThrow<number>('REDIS_PORT'),
      },
    });
  }

  async enqueue(job: PretranslateJob) {
    for (const lang of job.targetLangs) {
      await this.queue.add(
        'pretranslate',
        { ...job, targetLang: lang },
        {
          jobId: `${job.entityType}:${job.entityId}:${lang}`,
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: true,
          removeOnFail: 100,
        },
      );
    }
    this.logger.debug(
      `Enqueued pretranslate for ${job.entityType}:${job.entityId} → ${job.targetLangs.join(',')}`,
    );
  }

  async onModuleDestroy() {
    await this.queue.close();
  }
}
