import { PostVisibility } from '@/generated/prisma/enums';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';

export interface FeedCursor {
  createdAt: string;
  id: string;
}

@Injectable()
export class PostsRepository {
  constructor(private prisma: PrismaService) {}
  private readonly authorSelect = {
    id: true,
    username: true,
    fullname: true,
    avatarUrl: true,
  };

  private feedInclude(currentUserId: string) {
    return {
      author: { select: this.authorSelect },
      images: { orderBy: { position: 'asc' as const } },
      reactions: {
        where: { userId: currentUserId },
        select: { type: true },
        take: 1,
      },
    } as const;
  }

  async create(data: {
    content?: string;
    authorId: string;
    imageUrls?: string[];
    visibility?: PostVisibility;
  }) {
    return this.prisma.post.create({
      data: {
        content: data.content || null,
        authorId: data.authorId,
        visibility: data.visibility || PostVisibility.PUBLIC,
        images: data.imageUrls?.length
          ? {
              create: data.imageUrls.map((imageUrl, index) => ({
                imageUrl,
                position: index,
              })),
            }
          : {},
      },
      include: {
        author: {
          select: { id: true, username: true, fullname: true, avatarUrl: true },
        },
        images: { orderBy: { position: 'asc' } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, username: true, fullname: true, avatarUrl: true },
        },
        images: { orderBy: { position: 'asc' } },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.post.delete({ where: { id } });
  }

  // Lấy danh sách bạn bè đã accepted của user
  async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'ACCEPTED',
        OR: [
          {
            senderId: userId,
          },
          {
            receiverId: userId,
          },
        ],
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });

    if (!friendships.length) return [];

    // List ra danh sách id của bạn bè
    return friendships.map((friendship) => {
      const { senderId, receiverId } = friendship;

      if (senderId === userId) {
        return receiverId;
      }
      return senderId;
    });
  }

  async findBoostedPosts(userId: string) {
    const boostWindow = new Date(Date.now() - 3 * 60000);
    return this.prisma.post.findMany({
      where: {
        authorId: userId,
        createdAt: { gte: boostWindow },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: this.feedInclude(userId),
    });
  }

  async findPrimaryFeed(params: {
    friendIds: string[];
    cursor?: FeedCursor;
    limit: number;
    currentUserId: string;
  }) {
    const { friendIds, cursor, limit, currentUserId } = params;

    if (friendIds.length === 0) return [];

    const cursorFilter = cursor
      ? [
          { createdAt: { lt: new Date(cursor.createdAt) } },
          {
            createdAt: new Date(cursor.createdAt),
            id: { lt: cursor.id },
          },
        ]
      : null;

    return this.prisma.post.findMany({
      where: {
        AND: [
          {
            authorId: { in: friendIds },
            visibility: { in: [PostVisibility.PUBLIC, PostVisibility.FRIENDS] },
          },
          ...(cursorFilter ? [{ OR: cursorFilter }] : []),
        ],
      },
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: this.feedInclude(currentUserId),
    });
  }

  async findTrendingPosts(params: {
    excludeIds: string[];
    excludeAuthorId: string;
    limit: number;
    currentUserId: string;
  }) {
    const { excludeIds, excludeAuthorId, limit, currentUserId } = params;

    return this.prisma.post.findMany({
      where: {
        visibility: 'PUBLIC',
        authorId: { not: excludeAuthorId },
        ...(excludeIds.length > 0 && { id: { notIn: excludeIds } }),
      },
      take: limit,
      orderBy: [
        { reactionCount: 'desc' },
        { commentCount: 'desc' },
        { createdAt: 'desc' },
      ],
      include: this.feedInclude(currentUserId),
    });
  }

  async findByIdForViewer(postId: string, currentUserId: string) {
    return this.prisma.post.findUnique({
      where: { id: postId },
      include: this.feedInclude(currentUserId),
    });
  }

  async findByUser(params: {
    targetUserId: string;
    currentUserId: string;
    isFriend: boolean;
    cursor?: FeedCursor;
    limit: number;
  }) {
    const { targetUserId, currentUserId, cursor, limit, isFriend } = params;
    const isOwner = targetUserId === currentUserId;

    // Xác định bài viết nào được phép xem bởi người dùng hiện tại
    let visibilityFilter: object;

    if (isOwner) {
      // Chủ profile thấy tất cả, không cần filter
      visibilityFilter = {};
    } else if (isFriend) {
      // Bạn bè thấy PUBLIC + FRIENDS
      visibilityFilter = {
        visibility: { in: [PostVisibility.PUBLIC, PostVisibility.FRIENDS] },
      };
    } else {
      // Người lạ chỉ thấy PUBLIC
      visibilityFilter = {
        visibility: PostVisibility.PUBLIC,
      };
    }

    const cursorFilter = cursor
      ? [
          { createdAt: { lt: new Date(cursor.createdAt) } },
          {
            createdAt: new Date(cursor.createdAt),
            id: { lt: cursor.id },
          },
        ]
      : null;

    return this.prisma.post.findMany({
      where: {
        AND: [
          { authorId: targetUserId },
          visibilityFilter,
          ...(cursorFilter ? [{ OR: cursorFilter }] : []),
        ],
      },
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: this.feedInclude(currentUserId),
    });
  }

  async findPhotosByUser(params: {
    targetUserId: string;
    isOwner: boolean;
    isFriend: boolean;
    limit: number;
  }) {
    const { targetUserId, isOwner, isFriend, limit } = params;

    const postWhere: {
      authorId: string;
      visibility?: PostVisibility | { in: PostVisibility[] };
    } = { authorId: targetUserId };

    if (!isOwner) {
      if (isFriend) {
        postWhere.visibility = {
          in: [PostVisibility.PUBLIC, PostVisibility.FRIENDS],
        };
      } else {
        postWhere.visibility = PostVisibility.PUBLIC;
      }
    }

    return this.prisma.postImage.findMany({
      where: { post: postWhere },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        imageUrl: true,
        postId: true,
      },
    });
  }
}
