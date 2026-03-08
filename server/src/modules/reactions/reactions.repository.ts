import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { ReactionType } from '@/generated/prisma/client';

@Injectable()
export class ReactionsRepository {
  constructor(private prisma: PrismaService) {}

  async upsert(userId: string, postId: string, type: ReactionType) {
    return this.prisma.reaction.upsert({
      where: { userId_postId: { userId, postId } },
      create: { userId, postId, type },
      update: { type },
    });
  }

  async findByUserAndPost(userId: string, postId: string) {
    return this.prisma.reaction.findUnique({
      where: { userId_postId: { userId, postId } },
    });
  }

  async delete(userId: string, postId: string) {
    return this.prisma.reaction.delete({
      where: { userId_postId: { userId, postId } },
    });
  }

  async getReactionStats(postId: string) {
    return this.prisma.reaction.groupBy({
      by: ['type'],
      where: { postId },
      _count: { type: true },
    });
  }

  async findAllByPostId(
    postId: string,
    cursor?: string,
    limit: number = 5,
    type?: ReactionType,
  ) {
    return this.prisma.reaction.findMany({
      where: { postId, ...(type && { type }) },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        user: {
          select: {
            id: true,
            username: true,
            fullname: true,
            avatarUrl: true,
          },
        },
      },
    });
  }
}
