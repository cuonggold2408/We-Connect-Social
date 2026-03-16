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

@Injectable()
export class CommentsService {
  constructor(
    private commentsRepository: CommentsRepository,
    private postsRepository: PostsRepository,
    private counterQueue: CounterQueueService,
  ) {}

  private toResponseDto(
    comment: {
      id: string;
      content?: string | null;
      imageUrl?: string | null;
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
    },
    postAuthorId: string,
  ): CommentResponseDto {
    return new CommentResponseDto({
      id: comment.id,
      content: comment.content,
      imageUrl: comment.imageUrl,
      author: comment.author,
      parentId: comment.parentId,
      replyCount: comment._count.replies,
      isPostAuthor: comment.author.id === postAuthorId,
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

      // Giới hạn 2 tầng: nếu parent đã là reply thì gán parentId = parent.parentId
      if (parentComment.parentId) {
        dto.parentId = parentComment.parentId;
      }
    }

    if (!dto.content && !dto.imageUrl) {
      throw new ForbiddenException('Bình luận phải có nội dung hoặc ảnh');
    }

    const comment = await this.commentsRepository.create({
      content: dto.content,
      authorId: userId,
      postId,
      parentId: dto.parentId,
      imageUrl: dto.imageUrl,
    });

    await this.counterQueue.incrementCounter(postId, 'commentCount', 1);

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
    );
    return this.toResponseDto(updated, post.authorId);
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

    // Cho phép tác giả comment hoặc chủ bài viết xóa
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

  async getComments(postId: string, cursor?: string, limit: number = 10) {
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }

    const comments = await this.commentsRepository.findByPostId(
      postId,
      cursor,
      limit,
    );
    const hasMore = comments.length > limit;
    const sliced = hasMore ? comments.slice(0, limit) : comments;

    return {
      data: sliced.map((c) => this.toResponseDto(c, post.authorId)),
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    };
  }

  async getReplies(
    postId: string,
    commentId: string,
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
      cursor,
      limit,
    );
    const hasMore = replies.length > limit;
    const sliced = hasMore ? replies.slice(0, limit) : replies;

    return {
      data: sliced.map((c) => this.toResponseDto(c, post.authorId)),
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    };
  }
}
