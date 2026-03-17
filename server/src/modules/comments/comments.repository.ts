import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { ReactionType } from '@/generated/prisma/client';

@Injectable()
export class CommentsRepository {
  constructor(private prisma: PrismaService) {}

  private readonly authorSelect = {
    id: true,
    username: true,
    fullname: true,
    avatarUrl: true,
  };

  private responseInclude(currentUserId: string) {
    return {
      author: { select: this.authorSelect },
      _count: { select: { replies: true } },
      commentReactions: {
        where: { userId: currentUserId },
        select: { type: true },
        take: 1,
      },
    } as const;
  }

  async create(
    data: {
      content?: string;
      authorId: string;
      postId: string;
      parentId?: string;
      imageUrl?: string;
    },
    currentUserId: string,
  ) {
    return this.prisma.comment.create({
      data: {
        content: data.content || '',
        authorId: data.authorId,
        postId: data.postId,
        parentId: data.parentId || null,
        imageUrl: data.imageUrl || null,
      },
      include: this.responseInclude(currentUserId),
    });
  }

  async findById(id: string) {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: { select: this.authorSelect },
        _count: { select: { replies: true } },
      },
    });
  }

  async update(
    id: string,
    content: string,
    imageUrl?: string | null,
    currentUserId?: string,
  ) {
    return this.prisma.comment.update({
      where: { id },
      data: {
        content,
        updatedAt: new Date(),
        ...(imageUrl !== undefined && { imageUrl }),
      },
      include: currentUserId
        ? this.responseInclude(currentUserId)
        : {
            author: { select: this.authorSelect },
            _count: { select: { replies: true } },
          },
    });
  }

  async delete(id: string) {
    return this.prisma.comment.delete({ where: { id } });
  }

  async countReplies(commentId: string): Promise<number> {
    return this.prisma.comment.count({ where: { parentId: commentId } });
  }

  async findByPostId(
    postId: string,
    currentUserId: string,
    cursor?: string,
    limit: number = 10,
  ) {
    return this.prisma.comment.findMany({
      where: { postId, parentId: null },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: this.responseInclude(currentUserId),
    });
  }

  async findReplies(
    parentId: string,
    currentUserId: string,
    cursor?: string,
    limit: number = 5,
  ) {
    return this.prisma.comment.findMany({
      where: { parentId },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'asc' },
      include: this.responseInclude(currentUserId),
    });
  }

  async getReactionStatsBulk(commentIds: string[]) {
    if (commentIds.length === 0)
      return new Map<string, { type: ReactionType; count: number }[]>();

    const stats = await this.prisma.commentReaction.groupBy({
      by: ['commentId', 'type'],
      where: { commentId: { in: commentIds } },
      _count: { type: true },
    });

    const map = new Map<string, { type: ReactionType; count: number }[]>();
    for (const stat of stats) {
      const existing = map.get(stat.commentId) || [];
      existing.push({ type: stat.type, count: stat._count.type });
      map.set(stat.commentId, existing);
    }

    for (const [key, value] of map) {
      map.set(
        key,
        value.sort((a, b) => b.count - a.count),
      );
    }

    return map;
  }
}
