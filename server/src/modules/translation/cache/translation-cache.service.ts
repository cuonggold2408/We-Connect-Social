import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { TranslateOutput } from '@/modules/translation/providers/translation-provider.interface';
import {
  CACHE_TTL,
  LOCK_TTL,
  WAIT_MAX_ITERATIONS,
  WAIT_POLL_INTERVAL,
} from '@/modules/translation/constants/config';

@Injectable()
export class TranslationCacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(TranslationCacheService.name);

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.getOrThrow('REDIS_HOST'),
      port: this.config.getOrThrow<number>('REDIS_PORT'),
    });
  }

  private hashText(text: string): string {
    return createHash('sha1').update(text).digest('hex').slice(0, 16);
  }

  private cacheKey(text: string, source: string, target: string): string {
    return `tr:v1:${this.hashText(text)}:${source}:${target}`;
  }

  private lockKey(text: string, source: string, target: string): string {
    return `tr:lock:${this.hashText(text)}:${source}:${target}`;
  }

  async get(
    text: string,
    source: string,
    target: string,
  ): Promise<TranslateOutput | null> {
    const raw = await this.redis.get(this.cacheKey(text, source, target));
    if (!raw) {
      await this.redis.incr('tr:stats:misses');
      return null;
    }
    await this.redis.incr('tr:stats:hits');
    return JSON.parse(raw) as TranslateOutput;
  }

  async set(
    text: string,
    source: string,
    target: string,
    value: TranslateOutput,
  ): Promise<void> {
    await this.redis.set(
      this.cacheKey(text, source, target),
      JSON.stringify(value),
      'EX',
      CACHE_TTL,
    );
  }

  /**
   * Single-flight: chỉ có 1 request thật sự gọi provider, các request khác chờ
   * Trả về true nếu acquire được lock, caller phải gọi provider
   */
  async acquireLock(
    text: string,
    source: string,
    target: string,
  ): Promise<boolean> {
    const result = await this.redis.set(
      this.lockKey(text, source, target),
      '1',
      'EX',
      LOCK_TTL,
      'NX',
    );
    return result === 'OK';
  }

  async releaseLock(
    text: string,
    source: string,
    target: string,
  ): Promise<void> {
    await this.redis.del(this.lockKey(text, source, target));
  }

  /**
   * Chờ request khác hoàn thành
   */
  async waitForResult(
    text: string,
    source: string,
    target: string,
  ): Promise<TranslateOutput | null> {
    for (let i = 0; i < WAIT_MAX_ITERATIONS; i++) {
      await new Promise((r) => setTimeout(r, WAIT_POLL_INTERVAL));
      const cached = await this.get(text, source, target);
      if (cached) {
        await this.redis.incr('tr:stats:dedupe_saved');
        return cached;
      }
    }
    return null;
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
