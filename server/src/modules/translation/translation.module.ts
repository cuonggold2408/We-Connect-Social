import { Module } from '@nestjs/common';
import { TranslationService } from '@/modules/translation/translation.service';
import { TranslationController } from '@/modules/translation/translation.controller';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { TranslationRepository } from '@/modules/translation/translation.repository';
import { TranslationCacheService } from '@/modules/translation/cache/translation-cache.service';
import { TranslationQueueService } from '@/modules/translation/queue/translation-queue.service';
import { TranslationQueueProcessor } from '@/modules/translation/queue/translation-queue.processor';
import { LibreTranslateProvider } from '@/modules/translation/providers/libre-translate.provider';
import { TRANSLATION_PROVIDER } from '@/modules/translation/providers/translation-provider.interface';
import { PostCreatedListener } from '@/modules/translation/listeners/post-created.listener';
import { CommentCreatedListener } from '@/modules/translation/listeners/comment-created.listener';

@Module({
  imports: [PrismaModule, HttpModule],
  controllers: [TranslationController],
  providers: [
    TranslationService,
    TranslationRepository,
    TranslationCacheService,
    TranslationQueueService,
    TranslationQueueProcessor,
    LibreTranslateProvider,
    { provide: TRANSLATION_PROVIDER, useExisting: LibreTranslateProvider },
    PostCreatedListener,
    CommentCreatedListener,
  ],
  exports: [TranslationService, TranslationQueueService],
})
export class TranslationModule {}
