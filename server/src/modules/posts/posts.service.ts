import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/request/create-post.dto';
import { PostResponseDto } from './dto/response/post-response.dto';
import { FeedCacheService } from '@/shared/cache/feed-cache.service';

@Injectable()
export class PostsService {
  constructor(
    private postsRepository: PostsRepository,
    private feedCacheService: FeedCacheService,
  ) {}

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

  async getFeed(userId: string, cursor?: string, limit: number = 10) {
    // 1. Lấy friendIds từ redis trước, miss thì query DB
    let friendIds = await this.feedCacheService.getFriendIds(userId);
    if (!friendIds) {
      friendIds = await this.postsRepository.getFriendIds(userId);
      await this.feedCacheService.setFriendIds(userId, friendIds);
    }
    const hasFriends = friendIds.length > 0;

    type FeedPost = Awaited<
      ReturnType<PostsRepository['findFriendFeed']>
    >[number];
    let posts: FeedPost[];

    if (hasFriends) {
      const authorIds = [...friendIds, userId];
      posts = await this.postsRepository.findFriendFeed({
        authorIds,
        cursor,
        limit,
        currentUserId: userId,
      });
      // Ít bài → mix thêm trending
      if (posts.length <= limit) {
        const existingIds = posts.map((p) => p.id);
        const remaining = limit - posts.length + 1;
        if (remaining > 0) {
          const trending = await this.postsRepository.findTrendingPosts({
            excludeIds: existingIds,
            limit: remaining,
            currentUserId: userId,
          });
          posts = [...posts, ...trending];
        }
      }
    } else {
      posts = await this.postsRepository.findTrendingPosts({
        cursor,
        limit,
        currentUserId: userId,
      });
    }

    const hasMore = posts.length > limit;
    const sliced = hasMore ? posts.slice(0, limit) : posts;
    return {
      data: sliced.map(
        (post) =>
          new PostResponseDto({
            ...post,
            currentUserReaction: post.reactions?.[0]?.type ?? null,
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
