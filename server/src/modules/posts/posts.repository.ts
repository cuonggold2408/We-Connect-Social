import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';

@Injectable()
export class PostsRepository {
  constructor(private prisma: PrismaService) {}
  private readonly authorSelect = {
    id: true,
    username: true,
    fullname: true,
    avatarUrl: true,
  };

  async create(data: {
    content?: string;
    authorId: string;
    imageUrls?: string[];
  }) {
    return this.prisma.post.create({
      data: {
        content: data.content || null,
        authorId: data.authorId,
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
      const { senderId, receiverId } = friendship as {
        senderId: string;
        receiverId: string;
      };

      if (senderId === userId) {
        return receiverId;
      }
      return senderId;
    }) as string[];
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
    excludeIds?: string[]; // Bỏ qua bài đã lấy rồi
    cursor?: string;
    limit: number;
    currentUserId: string;
  }) {
    const { excludeIds, cursor, limit, currentUserId } = params;
    return this.prisma.post.findMany({
      where: {
        ...(excludeIds?.length && { id: { notIn: excludeIds } }),
      },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: [
        { reactionCount: 'desc' },
        { commentCount: 'desc' },
        { createdAt: 'desc' },
      ],
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
}
