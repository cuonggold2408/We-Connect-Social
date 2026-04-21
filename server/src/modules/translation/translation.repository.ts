import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '@shared/prisma/prisma.service';
import { TranslatableEntity } from '@/generated/prisma/enums';

export interface UpsertTranslationInput {
  entityType: TranslatableEntity;
  entityId: string;
  sourceLang: string;
  targetLang: string;
  sourceText: string;
  translatedText: string;
  provider: string;
  confidence?: number;
}

@Injectable()
export class TranslationRepository {
  constructor(private readonly prisma: PrismaService) {}

  upsert(input: UpsertTranslationInput) {
    const sourceTextHash = createHash('sha1')
      .update(input.sourceText)
      .digest('hex')
      .slice(0, 16);
    return this.prisma.contentTranslation.upsert({
      where: {
        entityType_entityId_targetLang: {
          entityType: input.entityType,
          entityId: input.entityId,
          targetLang: input.targetLang,
        },
      },
      create: {
        entityType: input.entityType,
        entityId: input.entityId,
        sourceLang: input.sourceLang,
        targetLang: input.targetLang,
        sourceTextHash,
        translatedText: input.translatedText,
        provider: input.provider,
        confidence: input.confidence,
      },
      update: {
        sourceTextHash,
        translatedText: input.translatedText,
        provider: input.provider,
        confidence: input.confidence,
      },
    });
  }

  findByEntity(
    entityType: TranslatableEntity,
    entityId: string,
    targetLang: string,
  ) {
    return this.prisma.contentTranslation.findUnique({
      where: {
        entityType_entityId_targetLang: { entityType, entityId, targetLang },
      },
    });
  }
}
