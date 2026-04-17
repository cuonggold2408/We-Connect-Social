import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { MessageType } from '@/generated/prisma/enums';
import { Prisma } from '@/generated/prisma/client';

const PARTICIPANT_USER_SELECT = {
  id: true,
  username: true,
  fullname: true,
  avatarUrl: true,
  lastActiveAt: true,
} as const;

const MESSAGE_INCLUDE = {
  sender: {
    select: {
      id: true,
      username: true,
      fullname: true,
      avatarUrl: true,
    },
  },
  replyTo: {
    select: {
      id: true,
      content: true,
      sender: {
        select: { id: true, fullname: true },
      },
    },
  },
} as const;

@Injectable()
export class ChatRepository {
  constructor(private prisma: PrismaService) {}

  findConversationBetween(userAId: string, userBId: string) {
    return this.prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: userAId } } },
          { participants: { some: { userId: userBId } } },
        ],
        participants: { every: { userId: { in: [userAId, userBId] } } },
      },
      include: {
        participants: {
          include: { user: { select: PARTICIPANT_USER_SELECT } },
        },
      },
    });
  }

  createConversation(userAId: string, userBId: string) {
    return this.prisma.conversation.create({
      data: {
        participants: {
          createMany: {
            data: [{ userId: userAId }, { userId: userBId }],
          },
        },
      },
      include: {
        participants: {
          include: { user: { select: PARTICIPANT_USER_SELECT } },
        },
      },
    });
  }

  findConversationsByUserId(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
        lastMessageAt: { not: null },
      },
      orderBy: { lastMessageAt: 'desc' },
      include: {
        participants: {
          include: { user: { select: PARTICIPANT_USER_SELECT } },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, fullname: true } },
          },
        },
      },
    });
  }

  async getConversationIds(userId: string): Promise<string[]> {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    return participants.map((p) => p.conversationId);
  }

  async isParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const count = await this.prisma.conversationParticipant.count({
      where: { conversationId, userId },
    });
    return count > 0;
  }

  async createMessage(data: {
    conversationId: string;
    senderId: string;
    content?: string;
    type: MessageType;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    replyToId?: string;
    callSessionId?: string;
  }) {
    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          conversationId: data.conversationId,
          senderId: data.senderId,
          type: data.type,
          ...(data.content !== undefined && { content: data.content }),
          ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl }),
          ...(data.fileName !== undefined && { fileName: data.fileName }),
          ...(data.fileSize !== undefined && { fileSize: data.fileSize }),
          ...(data.replyToId !== undefined && { replyToId: data.replyToId }),
          ...(data.callSessionId !== undefined && {
            callSessionId: data.callSessionId,
          }),
        },
        include: MESSAGE_INCLUDE,
      }),
      this.prisma.conversation.update({
        where: { id: data.conversationId },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    return message;
  }

  findMessages(conversationId: string, cursor?: string, limit = 30) {
    return this.prisma.message.findMany({
      where: { conversationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      include: MESSAGE_INCLUDE,
    });
  }

  markAsSeen(conversationId: string, userId: string) {
    return this.prisma.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  getParticipantReadStatus(conversationId: string) {
    return this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true, lastReadAt: true },
    });
  }

  async getUnreadCounts(
    conversationIds: string[],
    userId: string,
  ): Promise<Map<string, number>> {
    if (conversationIds.length === 0) return new Map();

    const results = await this.prisma.$queryRaw<
      { conversation_id: string; count: number }[]
    >`
      SELECT m.conversation_id, COUNT(*)::int AS count
      FROM messages m
      JOIN conversation_participants cp
        ON cp.conversation_id = m.conversation_id
        AND cp.user_id = ${userId}::uuid
      WHERE m.conversation_id IN (${Prisma.join(conversationIds.map((id) => Prisma.raw(`'${id}'::uuid`)))})
        AND m.sender_id != ${userId}::uuid
        AND m.deleted_at IS NULL
        AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
      GROUP BY m.conversation_id
    `;

    const map = new Map<string, number>();
    for (const r of results) {
      map.set(r.conversation_id, r.count);
    }
    return map;
  }

  softDeleteMessage(messageId: string, userId: string) {
    return this.prisma.message.updateMany({
      where: { id: messageId, senderId: userId },
      data: { deletedAt: new Date() },
    });
  }
}
