import { RedisThrottlerProvider } from '@/shared/throttler/redis-throttler.provider';
import { SlidingWindowStorageService } from '@/shared/throttler/sliding-window-storage.service';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [SlidingWindowThrottlerModule],
      inject: [SlidingWindowStorageService, ConfigService],
      useFactory: (
        storage: SlidingWindowStorageService,
        config: ConfigService,
      ) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,
            limit: config.getOrThrow<number>('THROTTLE_SHORT_LIMIT', 3),
          },
          {
            name: 'medium',
            ttl: 10000,
            limit: config.getOrThrow<number>('THROTTLE_MEDIUM_LIMIT', 20),
          },
          {
            name: 'long',
            ttl: 60000,
            limit: config.getOrThrow<number>('THROTTLE_LONG_LIMIT', 100),
          },
        ],
        storage,
      }),
    }),
  ],
  providers: [RedisThrottlerProvider, SlidingWindowStorageService],
  exports: [ThrottlerModule, SlidingWindowStorageService],
})
export class SlidingWindowThrottlerModule {}
