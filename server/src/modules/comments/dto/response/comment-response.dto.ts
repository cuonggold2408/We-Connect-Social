import { Expose, Type } from 'class-transformer';

class CommentAuthorDto {
  @Expose() id: string;
  @Expose() username: string;
  @Expose() fullname: string | null;
  @Expose() avatarUrl: string | null;
}

export class CommentResponseDto {
  @Expose() id: string;
  @Expose() content: string;

  @Expose()
  @Type(() => CommentAuthorDto)
  author: CommentAuthorDto;

  @Expose() parentId: string | null;
  @Expose() replyCount: number;
  @Expose() isPostAuthor: boolean;

  @Expose() createdAt: Date;
  @Expose() updatedAt: Date | null;

  constructor(partial: Partial<CommentResponseDto>) {
    Object.assign(this, partial);
  }
}
