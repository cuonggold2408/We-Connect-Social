import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ChatRepository } from '@/modules/chat/chat.repository';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { SuggestReplyDto } from '@/modules/call-assist/dto/suggest-reply.dto';
import {
  REPLY_SUGGESTION_PROVIDER,
  type ReplySuggestionProvider,
} from '@/modules/call-assist/providers/reply-suggestion-provider.interface';

@Injectable()
export class CallAssistService implements OnModuleDestroy {
  private readonly logger = new Logger(CallAssistService.name);
  private readonly redis: Redis;

  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(REPLY_SUGGESTION_PROVIDER)
    private readonly replyProvider: ReplySuggestionProvider,
  ) {
    this.redis = new Redis({
      host: this.config.getOrThrow('REDIS_HOST'),
      port: this.config.getOrThrow<number>('REDIS_PORT'),
    });
  }

  private async assertCanUseConversation(
    userId: string,
    conversationId: string,
  ) {
    const isParticipant = await this.chatRepository.isParticipant(
      conversationId,
      userId,
    );

    if (!isParticipant) {
      throw new ForbiddenException('Bạn không thuộc cuộc hội thoại này');
    }
  }

  private async assertCallBelongsToConversation(
    callSessionId: string,
    conversationId: string,
  ) {
    const call = await this.prisma.callSession.findFirst({
      where: { id: callSessionId, conversationId },
      select: { id: true },
    });

    if (!call) {
      throw new NotFoundException('Cuộc gọi không tồn tại');
    }
  }

  private async assertRateLimit(userId: string) {
    const limit = Number(this.config.get<string>('AI_REPLY_RATE_LIMIT') ?? 10);
    const windowSeconds = Number(
      this.config.get<string>('AI_REPLY_RATE_WINDOW_SECONDS') ?? 60,
    );
    const key = `call-assist:reply:${userId}`;

    const result = await this.redis.multi().incr(key).ttl(key).exec();
    const count = (result?.[0]?.[1] as number) ?? 0;
    const ttl = (result?.[1]?.[1] as number) ?? -1;

    if (ttl < 0) await this.redis.expire(key, windowSeconds);

    if (count > limit) {
      throw new HttpException(
        'Bạn tạo gợi ý quá nhanh, vui lòng thử lại sau',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private cleanText(text: string, maxLength: number): string {
    return text.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }

  async suggestReply(userId: string, dto: SuggestReplyDto) {
    await this.assertRateLimit(userId);
    await this.assertCanUseConversation(userId, dto.conversationId);

    if (dto.callSessionId) {
      await this.assertCallBelongsToConversation(
        dto.callSessionId,
        dto.conversationId,
      );
    }

    const originalSentence = this.cleanText(dto.originalSentence, 500);
    const recentContext = (dto.recentContext ?? [])
      .slice(-3)
      .map((text) => this.cleanText(text, 500))
      .filter(Boolean);

    const userIntent = dto.userIntent
      ? this.cleanText(dto.userIntent, 300)
      : undefined;

    const { suggestedReply, translatedReply, llmLatencyMs } =
      await this.replyProvider.suggestReply({
        originalSentence,
        remoteLang: dto.remoteLang,
        userLang: dto.userLang,
        recentContext,
        userIntent,
      });

    this.logger.debug(
      `Reply suggested user=${userId} conv=${dto.conversationId} latency=${llmLatencyMs}ms`,
    );

    return {
      originalQuestion: originalSentence,
      suggestedReply,
      translatedReply,
      llmLatencyMs,
    };
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
