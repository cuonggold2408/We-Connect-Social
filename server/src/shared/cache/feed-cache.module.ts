import { Global, Module } from '@nestjs/common';
import { FeedCacheService } from '@/shared/cache/feed-cache.service';

@Global()
@Module({
  providers: [FeedCacheService],
  exports: [FeedCacheService],
})
export class FeedCacheModule {}
