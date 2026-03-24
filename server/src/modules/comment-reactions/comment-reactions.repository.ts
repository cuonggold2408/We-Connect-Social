import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { ReactionType } from '@/generated/prisma/client';

@Injectable()
export class CommentReactionsRepository {
  constructor(private prisma: PrismaService) {}

  async upsert(userId: string, commentId: string, type: ReactionType) {
    return this.prisma.commentReaction.upsert({
      where: { userId_commentId: { userId, commentId } },
      create: { userId, commentId, type },
      update: { type },
    });
  }

  async findByUserAndComment(userId: string, commentId: string) {
    return this.prisma.commentReaction.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
  }

  async delete(userId: string, commentId: string) {
    return this.prisma.commentReaction.delete({
      where: { userId_commentId: { userId, commentId } },
    });
  }

  async getReactionStats(commentId: string) {
    return this.prisma.commentReaction.groupBy({
      by: ['type'],
      where: { commentId },
      _count: { type: true },
    });
  }

  async findAllByCommentId(
    commentId: string,
    cursor?: string,
    limit: number = 5,
    type?: ReactionType,
  ) {
    return this.prisma.commentReaction.findMany({
      where: { commentId, ...(type && { type }) },
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

  async findCommentById(commentId: string) {
    return this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, authorId: true },
    });
  }
}
