import { Module } from '@nestjs/common';
import { CommentReactionsService } from './comment-reactions.service';
import { CommentReactionsController } from './comment-reactions.controller';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { CommentReactionsRepository } from './comment-reactions.repository';
import { CounterQueueModule } from '@/shared/queue/counter-queue.module';

@Module({
  imports: [PrismaModule, CounterQueueModule],
  controllers: [CommentReactionsController],
  providers: [CommentReactionsService, CommentReactionsRepository],
  exports: [CommentReactionsService],
})
export class CommentReactionsModule {}
