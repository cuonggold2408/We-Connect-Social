import { RedisThrottlerProvider } from '@/shared/throttler/redis-throttler.provider';
import { SlidingWindowStorageService } from '@/shared/throttler/sliding-window-storage.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule,
    ThrottlerModule.forRootAsync({
      imports: [SlidingWindowThrottlerModule],
      inject: [SlidingWindowStorageService],
      useFactory: (storage: SlidingWindowStorageService) => ({
        throttlers: [
          { name: 'short', ttl: 1000, limit: 3 },
          { name: 'medium', ttl: 10000, limit: 20 },
          { name: 'long', ttl: 60000, limit: 100 },
        ],
        storage,
      }),
    }),
  ],
  providers: [RedisThrottlerProvider, SlidingWindowStorageService],
  exports: [ThrottlerModule, SlidingWindowStorageService],
})
export class SlidingWindowThrottlerModule {}
