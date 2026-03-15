import { forwardRef, Module } from '@nestjs/common';
import { CommentsService } from '@modules/comments/comments.service';
import { CommentsController } from '@modules/comments/comments.controller';
import { CommentsRepository } from '@modules/comments/comments.repository';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { PostsModule } from '@modules/posts/posts.module';
import { CounterQueueModule } from '@shared/queue/counter-queue.module';

@Module({
  imports: [PrismaModule, forwardRef(() => PostsModule), CounterQueueModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository],
  exports: [CommentsService],
})
export class CommentsModule {}
