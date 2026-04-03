import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export interface CachedSuggestion {
  id: string;
  username: string;
  fullname: string | null;
  avatarUrl: string | null;
  mutualCount: number;
}

@Injectable()
export class SuggestionCacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(SuggestionCacheService.name);

  private readonly SUGGESTIONS_TTL = 7200;
  private readonly DISMISSED_TTL = 2592000;

  constructor(private config: ConfigService) {
    this.redis = new Redis({
      host: this.config.getOrThrow('REDIS_HOST'),
      port: this.config.getOrThrow<number>('REDIS_PORT'),
    });
  }

  private suggestionsKey(userId: string) {
    return `suggestions:${userId}`;
  }

  private dismissedKey(userId: string) {
    return `suggestions:dismissed:${userId}`;
  }

  async getSuggestions(userId: string): Promise<CachedSuggestion[] | null> {
    const cached = await this.redis.get(this.suggestionsKey(userId));
    if (!cached) return null;
    return JSON.parse(cached) as CachedSuggestion[];
  }

  async setSuggestions(
    userId: string,
    suggestions: CachedSuggestion[],
  ): Promise<void> {
    await this.redis.set(
      this.suggestionsKey(userId),
      JSON.stringify(suggestions),
      'EX',
      this.SUGGESTIONS_TTL,
    );
  }

  async invalidate(userId: string): Promise<void> {
    await this.redis.del(this.suggestionsKey(userId));
    this.logger.debug(`Invalidated suggestions cache: ${userId}`);
  }

  async addDismissed(userId: string, targetUserId: string): Promise<void> {
    const key = this.dismissedKey(userId);
    await this.redis.sadd(key, targetUserId);
    await this.redis.expire(key, this.DISMISSED_TTL);
  }

  async getDismissedIds(userId: string): Promise<string[]> {
    return this.redis.smembers(this.dismissedKey(userId));
  }

  async removeSuggestionFromCache(
    userId: string,
    targetUserId: string,
  ): Promise<void> {
    const cached = await this.getSuggestions(userId);
    if (!cached) return;

    const filtered = cached.filter((s) => s.id !== targetUserId);
    if (filtered.length === cached.length) return;

    const ttl = await this.redis.ttl(this.suggestionsKey(userId));
    if (ttl > 0) {
      await this.redis.set(
        this.suggestionsKey(userId),
        JSON.stringify(filtered),
        'EX',
        ttl,
      );
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
