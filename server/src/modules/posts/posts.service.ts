import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/request/create-post.dto';
import { PostResponseDto } from './dto/response/post-response.dto';

@Injectable()
export class PostsService {
  constructor(private postsRepository: PostsRepository) {}

  async createPost(
    userId: string,
    dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    if (!dto.content && (!dto.imageUrls || dto.imageUrls.length === 0)) {
      throw new ForbiddenException(
        'Bài viết phải có nội dung hoặc ít nhất 1 ảnh',
      );
    }

    const post = await this.postsRepository.create({
      content: dto.content,
      authorId: userId,
      imageUrls: dto.imageUrls,
    });

    return new PostResponseDto({
      ...post,
      currentUserReaction: null,
    });
  }

  async getFeed(
    userId: string,
    cursor?: string,
    limit: number = 10,
  ): Promise<{
    data: PostResponseDto[];
    nextCursor: string | null;
  }> {
    const posts = await this.postsRepository.findFeed({
      cursor,
      limit,
      currentUserId: userId,
    });

    const hasMore = posts.length > limit;
    const sliced = hasMore ? posts.slice(0, limit) : posts;

    return {
      data: sliced.map(
        (post) =>
          new PostResponseDto({
            ...post,
            currentUserReaction: post.reactions[0]?.type ?? null,
          }),
      ),
      nextCursor: hasMore ? sliced[sliced.length - 1].id : null,
    };
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException('Bài viết không tồn tại');
    }
    if (post.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xoá bài viết này');
    }
    await this.postsRepository.delete(postId);
  }
}
