import { Injectable, NotFoundException } from '@nestjs/common';
import { ReactionsRepository } from '@modules/reactions/reactions.repository';
import { PostsRepository } from '@modules/posts/posts.repository';
import { CounterQueueService } from '@shared/queue/counter-queue.service';
import { NotificationType, ReactionType } from '@/generated/prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NOTIFICATION_EVENTS,
  NotificationEntityType,
  NotificationPayload,
} from '@modules/notifications/events/notifications.events';

@Injectable()
export class ReactionsService {
  constructor(
    private reactionsRepository: ReactionsRepository,
    private postsRepository: PostsRepository,
    private counterQueue: CounterQueueService,
    private eventEmitter: EventEmitter2,
  ) {}

  async react(userId: string, postId: string, type: ReactionType) {
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    const existingReactPost = await this.reactionsRepository.findByUserAndPost(
      userId,
      postId,
    );

    const reaction = await this.reactionsRepository.upsert(
      userId,
      postId,
      type,
    );

    if (!existingReactPost) {
      await this.counterQueue.incrementCounter(postId, 'reactionCount', 1);
    }

    if (post.authorId !== userId) {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.POST_REACTED, {
        actorId: userId,
        recipientId: post.authorId,
        type: NotificationType.POST_REACTION,
        entityType: NotificationEntityType.POST,
        entityId: postId,
        metadata: {
          reactionType: type,
        },
      } as NotificationPayload);
    }

    return reaction;
  }

  async removeReaction(userId: string, postId: string) {
    const existingReactPost = await this.reactionsRepository.findByUserAndPost(
      userId,
      postId,
    );
    if (!existingReactPost) {
      throw new NotFoundException('Bạn chưa react bài viết này');
    }

    await this.reactionsRepository.delete(userId, postId);

    await this.counterQueue.incrementCounter(postId, 'reactionCount', -1);
  }

  async getReactionStats(postId: string) {
    const groupedReactions =
      await this.reactionsRepository.getReactionStats(postId);

    return groupedReactions
      .map((item) => ({
        type: item.type,
        count: item._count.type,
      }))
      .sort((a, b) => b.count - a.count);
  }

  async getAllReactionsOfPost(
    postId: string,
    cursor?: string,
    limit: number = 5,
    type?: ReactionType,
  ) {
    const reactions = await this.reactionsRepository.findAllByPostId(
      postId,
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

  async getReactionStatsForPostIds(
    postIds: string[],
  ): Promise<Map<string, { type: ReactionType; count: number }[]>> {
    const rows =
      await this.reactionsRepository.getReactionStatsForPostIds(postIds);
    const map = new Map<string, { type: ReactionType; count: number }[]>();
    for (const row of rows) {
      const list = map.get(row.postId) ?? [];
      list.push({ type: row.type, count: row._count.type });
      map.set(row.postId, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => b.count - a.count);
    }
    return map;
  }
}
