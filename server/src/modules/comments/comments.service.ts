import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CommentsRepository } from '@modules/comments/comments.repository';
import { PostsRepository } from '@modules/posts/posts.repository';
import { CounterQueueService } from '@shared/queue/counter-queue.service';
import { CreateCommentDto } from '@modules/comments/dto/request/create-comment.dto';
import { UpdateCommentDto } from '@modules/comments/dto/request/update-comment.dto';
import { CommentResponseDto } from '@modules/comments/dto/response/comment-response.dto';
import { NotificationType, ReactionType } from '@/generated/prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NOTIFICATION_EVENTS,
  NotificationEntityType,
  NotificationPayload,
} from '@modules/notifications/events/notifications.events';

@Injectable()
export class CommentsService {
  constructor(
    private commentsRepository: CommentsRepository,
    private postsRepository: PostsRepository,
    private counterQueue: CounterQueueService,
    private eventEmitter: EventEmitter2,
  ) {}

  private toResponseDto(
    comment: {
      id: string;
      content?: string | null;
      imageUrl?: string | null;
      reactionCount: number;
      author: {
        id: string;
        username: string;
        fullname: string | null;
        avatarUrl: string | null;
      };
      parentId: string | null;
      createdAt: Date;
      updatedAt: Date | null;
      _count: { replies: number };
      commentReactions?: { type: ReactionType }[];
    },
    postAuthorId: string,
    statsMap?: Map<string, { type: ReactionType; count: number }[]>,
  ): CommentResponseDto {
    return new CommentResponseDto({
      id: comment.id,
      content: comment.content,
      imageUrl: comment.imageUrl,
      author: comment.author,
      parentId: comment.parentId,
      replyCount: comment._count.replies,
      isPostAuthor: comment.author.id === postAuthorId,
      reactionCount: comment.reactionCount,
      currentUserReaction: comment.commentReactions?.[0]?.type ?? null,
      stats: statsMap?.get(comment.id) ?? null,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    });
  }

  async createComment(userId: string, postId: string, dto: CreateCommentDto) {
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    if (dto.parentId) {
      const parentComment = await this.commentsRepository.findById(
        dto.parentId,
      );
      if (!parentComment) {
        throw new NotFoundException('Bình luận gốc không tồn tại');
      }
      if (parentComment.postId !== postId) {
        throw new ForbiddenException('Bình luận gốc không thuộc bài viết này');
      }

      if (parentComment.parentId) {
        dto.parentId = parentComment.parentId;
      }
    }

    if (!dto.content && !dto.imageUrl) {
      throw new ForbiddenException('Bình luận phải có nội dung hoặc ảnh');
    }

    const comment = await this.commentsRepository.create(
      {
        content: dto.content,
        authorId: userId,
        postId,
        parentId: dto.parentId,
        imageUrl: dto.imageUrl,
      },
      userId,
    );

    await this.counterQueue.incrementCounter(postId, 'commentCount', 1);

    if (post.authorId !== userId) {
      this.eventEmitter.emit(NOTIFICATION_EVENTS.POST_COMMENTED, {
        actorId: userId,
        recipientId: post.authorId,
        type: NotificationType.POST_COMMENT,
        entityType: NotificationEntityType.POST,
        entityId: postId,
        metadata: {
          commentPreview: dto.content?.substring(0, 100),
          commentId: comment.id,
        },
      } as NotificationPayload);

      if (dto.parentId) {
        const parentComment = await this.commentsRepository.findById(
          dto.parentId,
        );

        if (parentComment && parentComment.authorId !== userId) {
          this.eventEmitter.emit(NOTIFICATION_EVENTS.COMMENT_REPLIED, {
            actorId: userId,
            recipientId: parentComment.authorId,
            type: NotificationType.COMMENT_REPLY,
            entityType: NotificationEntityType.REPLY,
            entityId: dto.parentId,
            metadata: {
              commentPreview: dto.content?.substring(0, 100),
              postId,
            },
          } as NotificationPayload);
        }
      }
    }

    return this.toResponseDto(comment, post.authorId);
  }

  async updateComment(
    userId: string,
    postId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ) {
    const comment = await this.commentsRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    if (comment.postId !== postId) {
      throw new ForbiddenException('Bình luận không thuộc bài viết này');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa bình luận này',
      );
    }

    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    const content = dto.content !== undefined ? dto.content : comment.content;

    if (!content?.trim() && dto.imageUrl === null) {
      throw new ForbiddenException('Bình luận phải có nội dung hoặc ảnh');
    }

    const updated = await this.commentsRepository.update(
      commentId,
      content || '',
      dto.imageUrl,
      userId,
    );

    const statsMap =
      updated.reactionCount > 0
        ? await this.commentsRepository.getReactionStatsBulk([commentId])
        : new Map();

    return this.toResponseDto(updated, post.authorId, statsMap);
  }

  async deleteComment(userId: string, postId: string, commentId: string) {
    const comment = await this.commentsRepository.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    if (comment.postId !== postId) {
      throw new ForbiddenException('Bình luận không thuộc bài viết này');
    }

    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    if (comment.authorId !== userId && post.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    const replyCount = await this.commentsRepository.countReplies(commentId);
    await this.commentsRepository.delete(commentId);
    await this.counterQueue.incrementCounter(
      postId,
      'commentCount',
      -(1 + replyCount),
    );
  }

  async getComments(
    postId: string,
    currentUserId: string,
    cursor?: string,
    limit: number = 10,
  ) {
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    const comments = await this.commentsRepository.findByPostId(
      postId,
      currentUserId,
      cursor,
      limit,
    );
    const hasMore = comments.length > limit;
    const sliced = hasMore ? comments.slice(0, limit) : comments;

    const idsWithReactions = sliced
      .filter((c) => c.reactionCount > 0)
      .map((c) => c.id);
    const statsMap =
      await this.commentsRepository.getReactionStatsBulk(idsWithReactions);

    return {
      data: sliced.map((c) => this.toResponseDto(c, post.authorId, statsMap)),
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    };
  }

  async getReplies(
    postId: string,
    commentId: string,
    currentUserId: string,
    cursor?: string,
    limit: number = 5,
  ) {
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    const parentComment = await this.commentsRepository.findById(commentId);
    if (!parentComment) {
      throw new NotFoundException('Bình luận không tồn tại');
    }

    const replies = await this.commentsRepository.findReplies(
      commentId,
      currentUserId,
      cursor,
      limit,
    );
    const hasMore = replies.length > limit;
    const sliced = hasMore ? replies.slice(0, limit) : replies;

    const idsWithReactions = sliced
      .filter((c) => c.reactionCount > 0)
      .map((c) => c.id);
    const statsMap =
      await this.commentsRepository.getReactionStatsBulk(idsWithReactions);

    return {
      data: sliced.map((c) => this.toResponseDto(c, post.authorId, statsMap)),
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    };
  }
}
