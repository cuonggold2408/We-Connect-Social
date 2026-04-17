import Redis from 'ioredis';

export class WsRateLimiter {
  constructor(private redis: Redis) {}

  async check(
    userId: string,
    action: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const key = `ws:ratelimit:${action}:${userId}`;

    const multi = this.redis.multi();
    multi.incr(key);
    multi.expire(key, windowSeconds);
    const results = await multi.exec();

    const count = results?.[0]?.[1] as number;
    return count <= limit;
  }
}
