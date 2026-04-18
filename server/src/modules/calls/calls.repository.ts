import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { CallStatus, CallType } from '@/generated/prisma/enums';

const CALL_USER_SELECT = {
  id: true,
  username: true,
  fullname: true,
  avatarUrl: true,
} as const;

@Injectable()
export class CallsRepository {
  constructor(private prisma: PrismaService) {}

  create(data: {
    conversationId: string;
    callerId: string;
    calleeId: string;
    type: CallType;
  }) {
    return this.prisma.callSession.create({
      data: {
        conversationId: data.conversationId,
        callerId: data.callerId,
        calleeId: data.calleeId,
        type: data.type,
        status: 'RINGING',
      },
      include: {
        caller: { select: CALL_USER_SELECT },
        callee: { select: CALL_USER_SELECT },
      },
    });
  }

  findById(id: string) {
    return this.prisma.callSession.findUnique({
      where: { id },
      include: {
        caller: { select: CALL_USER_SELECT },
        callee: { select: CALL_USER_SELECT },
      },
    });
  }

  updateStatus(
    id: string,
    status: CallStatus,
    extra?: {
      startedAt?: Date;
      endedAt?: Date;
      duration?: number;
      endReason?: string;
    },
  ) {
    return this.prisma.callSession.update({
      where: { id },
      data: { status, ...extra },
    });
  }

  findActiveCall(userId: string) {
    return this.prisma.callSession.findFirst({
      where: {
        OR: [{ callerId: userId }, { calleeId: userId }],
        status: { in: ['RINGING', 'ACCEPTED'] },
      },
    });
  }

  async cleanupStaleSessions() {
    await this.prisma.callSession.updateMany({
      where: {
        OR: [
          {
            status: 'RINGING',
            createdAt: { lt: new Date(Date.now() - 60000) },
          },
          {
            status: 'ACCEPTED',
            startedAt: { lt: new Date(Date.now() - 24 * 60 * 60000) },
          },
        ],
      },
      data: {
        status: 'FAILED',
        endedAt: new Date(),
        endReason: 'stale',
      },
    });
  }
}
