import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { FeedCursor, PostsRepository } from './posts.repository';
import { CreatePostDto } from './dto/request/create-post.dto';
import { PostResponseDto } from './dto/response/post-response.dto';
import { FeedCacheService } from '@/shared/cache/feed-cache.service';
import { ReactionsService } from '../reactions/reactions.service';

@Injectable()
export class PostsService {
  constructor(
    private postsRepository: PostsRepository,
    private feedCacheService: FeedCacheService,
    private reactionsService: ReactionsService,
  ) {}

  private encodeCursor(post: { createdAt: Date; id: string }): string {
    const payload: FeedCursor = {
      createdAt: post.createdAt.toISOString(),
      id: post.id,
    };
    return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  }
  private decodeCursor(raw?: string): FeedCursor | null {
    if (!raw) return null;
    try {
      const json = Buffer.from(raw, 'base64url').toString('utf8');
      const parsed = JSON.parse(json) as FeedCursor;
      if (!parsed?.createdAt || !parsed?.id) return null;
      return parsed;
    } catch {
      return null;
    }
  }

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
      visibility: dto.visibility,
    });

    return new PostResponseDto({
      ...post,
      currentUserReaction: null,
    });
  }

  async getFeed(userId: string, cursor?: string, limit: number = 10) {
    let friendIds = await this.feedCacheService.getFriendIds(userId);
    if (!friendIds) {
      friendIds = await this.postsRepository.getFriendIds(userId);
      await this.feedCacheService.setFriendIds(userId, friendIds);
    }

    const decodedCursor = this.decodeCursor(cursor);
    const isFirstPage = !decodedCursor;

    type FeedPost = Awaited<
      ReturnType<PostsRepository['findPrimaryFeed']>
    >[number];

    let boostedPosts: FeedPost[] = [];
    if (isFirstPage) {
      boostedPosts = await this.postsRepository.findBoostedPosts(userId);
    }

    const primaryPosts = await this.postsRepository.findPrimaryFeed({
      friendIds,
      cursor: decodedCursor ?? undefined,
      limit,
      currentUserId: userId,
    });

    const primaryHasMore = primaryPosts.length > limit;

    const boostedIds = new Set(boostedPosts.map((p) => p.id));
    const primaryDeduped = primaryPosts.filter((p) => !boostedIds.has(p.id));

    const primarySlots = limit - boostedPosts.length;
    const primaryToShow = primaryDeduped.slice(0, primarySlots);

    let displayPosts: FeedPost[] = [...boostedPosts, ...primaryToShow];

    if (isFirstPage && displayPosts.length < limit) {
      const existingIds = displayPosts.map((p) => p.id);
      const remaining = limit - displayPosts.length;
      if (remaining > 0) {
        const trending = await this.postsRepository.findTrendingPosts({
          excludeIds: existingIds,
          excludeAuthorId: userId,
          limit: remaining,
          currentUserId: userId,
        });
        displayPosts = [...displayPosts, ...trending];
      }
    }

    const postsWithStats = await Promise.all(
      displayPosts.map(async (post) => {
        const stats = await this.reactionsService.getReactionStats(post.id);
        return new PostResponseDto({
          ...post,
          currentUserReaction: post.reactions?.[0]?.type ?? null,
          stats,
        });
      }),
    );

    const lastPrimary = primaryToShow[primaryToShow.length - 1];

    return {
      data: postsWithStats,
      nextCursor:
        primaryHasMore && lastPrimary ? this.encodeCursor(lastPrimary) : null,
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

  async getPostById(userId: string, postId: string): Promise<PostResponseDto> {
    const post = await this.postsRepository.findByIdForViewer(postId, userId);
    if (!post) throw new NotFoundException('Bài viết không tồn tại');

    const stats = await this.reactionsService.getReactionStats(postId);
    return new PostResponseDto({
      ...post,
      currentUserReaction: post.reactions?.[0]?.type ?? null,
      stats,
    });
  }
}
