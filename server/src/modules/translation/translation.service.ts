import { Inject, Injectable } from '@nestjs/common';
import {
  TranslateOutput,
  TRANSLATION_PROVIDER,
} from '@/modules/translation/providers/translation-provider.interface';
import type { ITranslationProvider } from '@/modules/translation/providers/translation-provider.interface';
import { TranslationCacheService } from '@/modules/translation/cache/translation-cache.service';
import { TranslationRepository } from '@/modules/translation/translation.repository';
import { TranslateRequestDto } from '@/modules/translation/dto/translate-request.dto';

@Injectable()
export class TranslationService {
  constructor(
    @Inject(TRANSLATION_PROVIDER)
    private readonly provider: ITranslationProvider,
    private readonly translationCacheService: TranslationCacheService,
    private readonly translationRepository: TranslationRepository,
  ) {}

  private shouldSkip(text: string): boolean {
    const trimmed = text.trim();
    if (!trimmed) return true;
    const textOnly = trimmed
      .replace(/https?:\/\/\S+/g, '')
      .replace(/@\w+/g, '')
      .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '')
      .trim();
    return textOnly.length < 2;
  }

  async translate(
    translateRequestDto: TranslateRequestDto,
  ): Promise<TranslateOutput & { cached: boolean }> {
    const { text, targetLang } = translateRequestDto;

    if (this.shouldSkip(text)) {
      return {
        translatedText: text,
        sourceLang: targetLang,
        provider: 'skip',
        cached: true,
      };
    }

    const source = translateRequestDto.sourceLang ?? 'auto';

    const cached = await this.translationCacheService.get(
      text,
      source,
      targetLang,
    );
    if (cached) {
      if (cached.sourceLang === targetLang) {
        return { ...cached, translatedText: text, cached: true };
      }
      return { ...cached, cached: true };
    }

    const hasLock = await this.translationCacheService.acquireLock(
      text,
      source,
      targetLang,
    );
    if (!hasLock) {
      const waited = await this.translationCacheService.waitForResult(
        text,
        source,
        targetLang,
      );
      if (waited) return { ...waited, cached: true };
    }

    try {
      const result = await this.provider.translate({
        text,
        sourceLang: translateRequestDto.sourceLang,
        targetLang,
      });

      await this.translationCacheService.set(text, source, targetLang, result);

      if (translateRequestDto.entityType && translateRequestDto.entityId) {
        void this.translationRepository.upsert({
          entityType: translateRequestDto.entityType,
          entityId: translateRequestDto.entityId,
          sourceLang: result.sourceLang,
          targetLang,
          sourceText: text,
          translatedText: result.translatedText,
          provider: result.provider,
          confidence: result.confidence,
        });
      }

      return { ...result, cached: false };
    } finally {
      if (hasLock) {
        await this.translationCacheService.releaseLock(
          text,
          source,
          targetLang,
        );
      }
    }
  }
}
