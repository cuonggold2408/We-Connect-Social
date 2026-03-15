import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';

@Injectable()
export class CommentsRepository {
  constructor(private prisma: PrismaService) {}

  private readonly authorSelect = {
    id: true,
    username: true,
    fullname: true,
    avatarUrl: true,
  };

  async create(data: {
    content: string;
    authorId: string;
    postId: string;
    parentId?: string;
  }) {
    return this.prisma.comment.create({
      data: {
        content: data.content,
        authorId: data.authorId,
        postId: data.postId,
        parentId: data.parentId || null,
      },
      include: {
        author: { select: this.authorSelect },
        _count: { select: { replies: true } },
      },
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

  async update(id: string, content: string) {
    return this.prisma.comment.update({
      where: { id },
      data: { content, updatedAt: new Date() },
      include: {
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

  async findByPostId(postId: string, cursor?: string, limit: number = 10) {
    return this.prisma.comment.findMany({
      where: { postId, parentId: null },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: this.authorSelect },
        _count: { select: { replies: true } },
      },
    });
  }

  async findReplies(parentId: string, cursor?: string, limit: number = 5) {
    return this.prisma.comment.findMany({
      where: { parentId },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: this.authorSelect },
        _count: { select: { replies: true } },
      },
    });
  }
}
