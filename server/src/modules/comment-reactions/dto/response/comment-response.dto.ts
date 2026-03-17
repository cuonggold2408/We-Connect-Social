import { Expose, Type } from 'class-transformer';
import { ReactionType } from '@/generated/prisma/enums';

class CommentAuthorDto {
  @Expose() id: string;
  @Expose() username: string;
  @Expose() fullname: string | null;
  @Expose() avatarUrl: string | null;
}

export class CommentResponseDto {
  @Expose() id: string;
  @Expose() content: string | null;
  @Expose() imageUrl: string | null;

  @Expose()
  @Type(() => CommentAuthorDto)
  author: CommentAuthorDto;

  @Expose() parentId: string | null;
  @Expose() replyCount: number;
  @Expose() isPostAuthor: boolean;

  @Expose() reactionCount: number;
  @Expose() currentUserReaction: ReactionType | null;
  @Expose() stats: { type: ReactionType; count: number }[] | null;

  @Expose() createdAt: Date;
  @Expose() updatedAt: Date | null;

  constructor(partial: Partial<CommentResponseDto>) {
    Object.assign(this, partial);
  }
}
