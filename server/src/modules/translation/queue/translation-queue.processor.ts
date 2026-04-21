import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import { TranslationService } from '@/modules/translation/translation.service';

@Injectable()
export class TranslationQueueProcessor
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(TranslationQueueProcessor.name);
  private worker: Worker;

  constructor(
    private readonly configService: ConfigService,
    private readonly translationService: TranslationService,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      'translation-pretranslate',
      async (job: Job) => {
        const { text, targetLang, entityType, entityId } = job.data;
        await this.translationService.translate({
          text,
          targetLang,
          entityType,
          entityId,
        });
      },
      {
        connection: {
          host: this.configService.getOrThrow('REDIS_HOST'),
          port: this.configService.getOrThrow<number>('REDIS_PORT'),
        },
        concurrency: 4,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Pretranslate job ${job?.id} failed: ${err.message}`);
    });
    this.logger.log('Translation worker started (concurrency=4)');
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
