import { forwardRef, Module } from '@nestjs/common';
import { ReactionsService } from '@modules/reactions/reactions.service';
import { ReactionsController } from '@modules/reactions/reactions.controller';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { PostsModule } from '@modules/posts/posts.module';
import { ReactionsRepository } from '@modules/reactions/reactions.repository';
import { CounterQueueModule } from '@shared/queue/counter-queue.module';

@Module({
  imports: [PrismaModule, forwardRef(() => PostsModule), CounterQueueModule],
  controllers: [ReactionsController],
  providers: [ReactionsService, ReactionsRepository],
  exports: [ReactionsService],
})
export class ReactionsModule {}
