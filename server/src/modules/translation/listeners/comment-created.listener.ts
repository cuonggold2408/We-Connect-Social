import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TranslationQueueService } from '@/modules/translation/queue/translation-queue.service';
import { TranslatableEntity } from '@/generated/prisma/enums';
import { TRANSLATION_EVENTS } from '@/modules/translation/constants/config';

@Injectable()
export class CommentCreatedListener {
  private readonly DEFAULT_LANGS = ['vi', 'en'];

  constructor(
    private readonly translationQueueService: TranslationQueueService,
  ) {}

  @OnEvent(TRANSLATION_EVENTS.COMMENT_CREATED)
  async handle(payload: { commentId: string; content: string | null }) {
    if (!payload.content || payload.content.trim().length < 2) return;
    await this.translationQueueService.enqueue({
      entityType: TranslatableEntity.COMMENT,
      entityId: payload.commentId,
      text: payload.content,
      targetLangs: this.DEFAULT_LANGS,
    });
  }
}
