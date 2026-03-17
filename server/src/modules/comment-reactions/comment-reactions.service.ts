import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentReactionsRepository } from './comment-reactions.repository';
import { CounterQueueService } from '@shared/queue/counter-queue.service';
import { ReactionType } from '@/generated/prisma/client';

@Injectable()
export class CommentReactionsService {
  constructor(
    private commentReactionsRepository: CommentReactionsRepository,
    private counterQueue: CounterQueueService,
  ) {}

  async react(userId: string, commentId: string, type: ReactionType) {
    const exists =
      await this.commentReactionsRepository.commentExists(commentId);
    if (!exists) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    const existing = await this.commentReactionsRepository.findByUserAndComment(
      userId,
      commentId,
    );

    const reaction = await this.commentReactionsRepository.upsert(
      userId,
      commentId,
      type,
    );

    if (!existing) {
      await this.counterQueue.incrementCommentReactionCounter(commentId, 1);
    }

    return reaction;
  }

  async removeReaction(userId: string, commentId: string) {
    const existing = await this.commentReactionsRepository.findByUserAndComment(
      userId,
      commentId,
    );
    if (!existing) {
      throw new NotFoundException('Bạn chưa react bình luận này');
    }

    await this.commentReactionsRepository.delete(userId, commentId);
    await this.counterQueue.incrementCommentReactionCounter(commentId, -1);
  }

  async getReactionStats(commentId: string) {
    const grouped =
      await this.commentReactionsRepository.getReactionStats(commentId);

    return grouped
      .map((item) => ({
        type: item.type,
        count: item._count.type,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async getAllReactions(
    commentId: string,
    cursor?: string,
    limit: number = 5,
    type?: ReactionType,
  ) {
    const reactions = await this.commentReactionsRepository.findAllByCommentId(
      commentId,
      cursor,
      limit,
      type,
    );

    const hasMore = reactions.length > limit;
    const slicedData = hasMore ? reactions.slice(0, limit) : reactions;

    return {
      data: slicedData,
      nextCursor: hasMore ? slicedData[slicedData.length - 1].id : null,
    };
  }
}
