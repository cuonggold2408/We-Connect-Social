import { Injectable, NotFoundException } from '@nestjs/common';
import { CommentReactionsRepository } from './comment-reactions.repository';
import { CounterQueueService } from '@shared/queue/counter-queue.service';
import { NotificationType, ReactionType } from '@/generated/prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NOTIFICATION_EVENTS,
  NotificationEntityType,
  NotificationPayload,
} from '@modules/notifications/events/notifications.events';

@Injectable()
export class CommentReactionsService {
  constructor(
    private commentReactionsRepository: CommentReactionsRepository,
    private counterQueue: CounterQueueService,
    private eventEmitter: EventEmitter2,
  ) {}

  async react(userId: string, commentId: string, type: ReactionType) {
    const comment =
      await this.commentReactionsRepository.findCommentById(commentId);
    if (!comment) {
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

    if (comment.authorId !== userId) {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.COMMENT_REACTED, {
        actorId: userId,
        recipientId: comment.authorId,
        type: NotificationType.COMMENT_REACTION,
        entityType: NotificationEntityType.REPLY,
        entityId: commentId,
        metadata: { reactionType: type },
      } as NotificationPayload);
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
