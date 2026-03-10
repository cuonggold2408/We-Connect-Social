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

  async findFeed(params: {
    cursor?: string;
    limit: number;
    currentUserId: string;
  }) {
    const { cursor, limit, currentUserId } = params;

    return this.prisma.post.findMany({
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, fullname: true, avatarUrl: true },
        },
        images: { orderBy: { position: 'asc' } },
        reactions: {
          where: { userId: currentUserId },
          select: { type: true },
          take: 1,
        },
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
    const oneMinuteAgo = new Date(Date.now() - 60_000);
    return this.prisma.post.findMany({
      where: {
        authorId: userId,
        createdAt: { gte: oneMinuteAgo },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: this.feedInclude(userId),
    });
  }

  async findPrimaryFeed(params: {
    userId: string;
    friendIds: string[];
    cursor?: FeedCursor;
    limit: number;
    currentUserId: string;
  }) {
    const { userId, friendIds, cursor, limit, currentUserId } = params;
    const visibilityFilter =
      friendIds.length > 0
        ? [
            { authorId: userId },
            {
              authorId: { in: friendIds },
              visibility: { in: ['PUBLIC', 'FRIENDS'] as PostVisibility[] },
            },
          ]
        : [{ authorId: userId }];
    const cursorFilter = cursor
      ? [
          { createdAt: { lt: new Date(cursor.createdAt) } },
          {
            createdAt: new Date(cursor.createdAt),
            id: { lt: cursor.id },
          },
        ]
      : undefined;
    return this.prisma.post.findMany({
      where: {
        AND: [
          { OR: visibilityFilter },
          ...(cursorFilter ? [{ OR: cursorFilter }] : []),
        ],
      },
      take: limit + 1,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: this.feedInclude(currentUserId),
    });
  }

  // Lấy bài viết của bạn bè và bản thân
  async findFriendFeed(params: {
    authorIds: string[];
    cursor?: string;
    limit: number;
    currentUserId: string;
  }) {
    const { authorIds, cursor, limit, currentUserId } = params;
    return this.prisma.post.findMany({
      where: { authorId: { in: authorIds } },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: this.authorSelect },
        images: { orderBy: { position: 'asc' } },
        reactions: {
          where: { userId: currentUserId },
          select: { type: true },
          take: 1,
        },
      },
    });
  }

  async findTrendingPosts(params: {
    excludeIds: string[];
    limit: number;
    currentUserId: string;
  }) {
    const { excludeIds, limit, currentUserId } = params;
    return this.prisma.post.findMany({
      where: {
        visibility: 'PUBLIC',
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
}
