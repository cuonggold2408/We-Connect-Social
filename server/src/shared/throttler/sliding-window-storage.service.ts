import { THROTTLER_REDIS } from '@/shared/throttler/redis-throttler.provider';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import { randomUUID } from 'crypto';
import Redis from 'ioredis';

@Injectable()
export class SlidingWindowStorageService
  implements ThrottlerStorage, OnModuleDestroy
{
  private readonly luaScript = `
    local key = KEYS[1]
    local blockKey = KEYS[2]
    local windowStart = tonumber(ARGV[1])
    local now = tonumber(ARGV[2])
    local memberId = ARGV[3]
    local ttl = tonumber(ARGV[4])
    local limit = tonumber(ARGV[5])
    local blockDuration = tonumber(ARGV[6])

    local blockTTL = redis.call('PTTL', blockKey)
    if blockTTL and blockTTL > 0 then
      return {limit, 0, 1, blockTTL}
    end

    redis.call('ZREMRANGEBYSCORE', key, 0, windowStart)

    redis.call('ZADD', key, now, memberId)

    local totalHits = redis.call('ZCARD', key)

    redis.call('PEXPIRE', key, ttl)

    local realTTL = redis.call('PTTL', key)
    if realTTL < 0 then
      realTTL = ttl
    end

    local isBlocked = 0
    local timeToBlockExpire = 0

    if totalHits > limit then
      isBlocked = 1

      redis.call('ZREM', key, memberId)
      totalHits = totalHits - 1

      if blockDuration > 0 then
        redis.call('SET', blockKey, '1', 'PX', blockDuration)
        timeToBlockExpire = redis.call('PTTL', blockKey)
        if timeToBlockExpire < 0 then
          timeToBlockExpire = blockDuration
        end
      end
    end

    return {totalHits, realTTL, isBlocked, timeToBlockExpire}
  `;

  constructor(@Inject(THROTTLER_REDIS) private readonly redis: Redis) {
    this.redis.defineCommand('slidingWindowIncrement', {
      numberOfKeys: 2,
      lua: this.luaScript,
    });
  }

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const now = Date.now();
    const windowStart = now - ttl;
    const memberId = `${now}-${randomUUID()}`;

    const nsKey = `throttle:${key}`;
    const blockKey = `${nsKey}:blocked`;

    const result = await (this.redis as any).slidingWindowIncrement(
      nsKey,
      blockKey,
      windowStart,
      now,
      memberId,
      ttl,
      limit,
      blockDuration,
    );

    const [totalHits, timeToExpire, isBlocked, timeToBlockExpire] =
      result as number[];

    return {
      totalHits,
      timeToExpire,
      isBlocked: isBlocked === 1,
      timeToBlockExpire,
    };
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
