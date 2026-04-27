import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import Redis from 'ioredis';
import { SPEECH_CONFIG } from '@/modules/speech/constants/speech.config';
import { GrantTokenResponse } from '@/modules/speech/dto/grant-token.response.dto';

@Injectable()
export class SpeechService implements OnModuleDestroy {
  private readonly logger = new Logger(SpeechService.name);
  private readonly redis: Redis;
  private readonly apiKey: string;
  private readonly authGrantUrl: string;
  private readonly websocketListenUrl: string;
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {
    this.apiKey = this.config.getOrThrow<string>('DEEPGRAM_API_KEY');
    this.authGrantUrl = this.config.getOrThrow<string>('DEEPGRAM_AUTH_GRANT');
    this.websocketListenUrl = this.config.getOrThrow<string>(
      'DEEPGRAM_WEBSOCKET_LISTEN',
    );
    this.redis = new Redis({
      host: this.config.getOrThrow('REDIS_HOST'),
      port: this.config.getOrThrow<number>('REDIS_PORT'),
    });
  }

  private async assertRateLimit(userId: string): Promise<void> {
    const key = `speech:rate:${userId}`;
    const m = this.redis.multi();
    m.incr(key);
    m.expire(key, SPEECH_CONFIG.PER_USER_RATE_WINDOW_SECONDS);
    const results = await m.exec();
    const count = (results?.[0]?.[1] as number) ?? 0;

    if (count > SPEECH_CONFIG.PER_USER_RATE_LIMIT) {
      throw new HttpException(
        `Bạn thao tác quá nhanh, vui lòng chờ ${SPEECH_CONFIG.PER_USER_RATE_WINDOW_SECONDS}s`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async consumeDailyQuota(userId: string): Promise<number> {
    const day = new Date().toISOString().slice(0, 10);
    const key = `speech:quota:${userId}:${day}`;

    const m = this.redis.multi();
    m.incr(key);
    m.ttl(key);
    const results = await m.exec();
    const count = (results?.[0]?.[1] as number) ?? 0;
    const ttl = (results?.[1]?.[1] as number) ?? -1;

    if (ttl < 0) {
      await this.redis.expire(key, 86400);
    }

    if (count > SPEECH_CONFIG.DAILY_TOKEN_QUOTA) {
      await this.redis.decr(key);
      throw new HttpException(
        'Bạn đã hết quota ghi âm hôm nay',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return SPEECH_CONFIG.DAILY_TOKEN_QUOTA - count;
  }

  private async callDeepgramGrant(): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    try {
      const response = this.http
        .post<{ access_token: string; expires_in: number }>(
          this.authGrantUrl,
          {
            ttl_seconds: SPEECH_CONFIG.TOKEN_TTL_SECONDS,
          },
          {
            headers: {
              Authorization: `Token ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        )
        .pipe(
          timeout(SPEECH_CONFIG.DEEPGRAM_GRANT_TIMEOUT_MS),
          catchError((err) => {
            this.logger.error(
              `Deepgram /auth/grant failed: ${err.message}`,
              err.stack,
            );
            throw new HttpException(
              'Dịch vụ STT tạm thời không khả dụng',
              HttpStatus.SERVICE_UNAVAILABLE,
            );
          }),
        );

      const { data } = await firstValueFrom(response);
      return {
        accessToken: data.access_token,
        expiresIn: data.expires_in,
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      this.logger.error(
        `Unexpected error from Deepgram: ${(err as Error).message}`,
      );
      throw new HttpException(
        'Không thể cấp token STT',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async grantTokenForUser(userId: string): Promise<GrantTokenResponse> {
    await this.assertRateLimit(userId);
    const remaining = await this.consumeDailyQuota(userId);
    const token = await this.callDeepgramGrant();

    this.logger.log(
      `Speech token granted: user=${userId} ttl=${token.expiresIn}s remaining=${remaining}`,
    );

    return {
      accessToken: token.accessToken,
      expiresIn: token.expiresIn,
      remainingTokensToday: remaining,
      model: 'nova-3',
      websocketUrl: this.websocketListenUrl,
    };
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
