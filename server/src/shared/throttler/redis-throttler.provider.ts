import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const THROTTLER_REDIS = Symbol('THROTTLER_REDIS');

export const RedisThrottlerProvider: Provider = {
  provide: THROTTLER_REDIS,
  useFactory: (config: ConfigService): Redis => {
    return new Redis({
      host: config.getOrThrow('REDIS_HOST'),
      port: config.getOrThrow<number>('REDIS_PORT'),
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 200, 2000),
    });
  },
  inject: [ConfigService],
};
