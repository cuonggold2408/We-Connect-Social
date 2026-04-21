import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TranslationQueueService } from '@/modules/translation/queue/translation-queue.service';
import { TranslatableEntity } from '@/generated/prisma/enums';
import { TRANSLATION_EVENTS } from '@/modules/translation/constants/config';

@Injectable()
export class PostCreatedListener {
  private readonly DEFAULT_LANGS = ['vi', 'en'];

  constructor(
    private readonly translationQueueService: TranslationQueueService,
  ) {}

  @OnEvent(TRANSLATION_EVENTS.POST_CREATED)
  async handle(payload: { postId: string; content: string | null }) {
    if (!payload.content || payload.content.length < 2) return;
    await this.translationQueueService.enqueue({
      entityType: TranslatableEntity.POST,
      entityId: payload.postId,
      text: payload.content,
      targetLangs: this.DEFAULT_LANGS,
    });
  }
}
