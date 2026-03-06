import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class FeedCacheService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly logger = new Logger(FeedCacheService.name);

  private friendKey(userId: string) {
    return `feed:friends:${userId}`;
  }
  private trendingKey() {
    return `feed:trending`;
  }

  constructor(private config: ConfigService) {
    this.redis = new Redis({
      host: this.config.getOrThrow('REDIS_HOST'),
      port: this.config.getOrThrow<number>('REDIS_PORT'),
    });
  }

  async getFriendIds(userId: string): Promise<string[] | null> {
    const cached = await this.redis.get(this.friendKey(userId));
    if (!cached) return null;
    return JSON.parse(cached) as string[];
  }

  async setFriendIds(userId: string, friendIds: string[]): Promise<void> {
    await this.redis.set(
      this.friendKey(userId),
      JSON.stringify(friendIds),
      'EX',
      300,
    );
  }

  // Gọi khi thêm/xoá bạn → xoá cache của cả 2 user
  async invalidateFriends(userA: string, userB: string): Promise<void> {
    await this.redis.del(this.friendKey(userA), this.friendKey(userB));
    this.logger.debug(`Invalidated friend cache: ${userA}, ${userB}`);
  }

  async getTrendingIds(): Promise<string[] | null> {
    const cached = await this.redis.get(this.trendingKey());
    if (!cached) return null;
    return JSON.parse(cached) as string[];
  }

  async setTrendingIds(postIds: string[]): Promise<void> {
    await this.redis.set(this.trendingKey(), JSON.stringify(postIds), 'EX', 60);
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
