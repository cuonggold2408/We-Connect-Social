import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';

@Injectable()
export class PostsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    content?: string;
    authorId: string;
    imageUrls?: string[];
  }) {
    return this.prisma.post.create({
      data: {
        content: data.content,
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
}
