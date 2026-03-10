import { PostVisibility, ReactionType } from '@/generated/prisma/enums';
import { Expose, Type } from 'class-transformer';

class AuthorDto {
  @Expose() id: string;
  @Expose() username: string;
  @Expose() fullname: string | null;
  @Expose() avatarUrl: string | null;
}

class PostImageDto {
  @Expose() id: string;
  @Expose() imageUrl: string;
  @Expose() position: number;
}

export class PostResponseDto {
  @Expose() id: string;
  @Expose() content: string | null;
  @Expose() visibility: PostVisibility;
  @Expose() reactionCount: number;
  @Expose() commentCount: number;

  @Expose()
  @Type(() => AuthorDto)
  author: AuthorDto;

  @Expose()
  @Type(() => PostImageDto)
  images: PostImageDto[];

  @Expose() createdAt: Date;
  @Expose() updatedAt: Date | null;

  @Expose() currentUserReaction: string | null;

  @Expose() stats: { type: ReactionType; count: number }[] | null;

  constructor(partial: Partial<PostResponseDto>) {
    Object.assign(this, partial);
  }
}
