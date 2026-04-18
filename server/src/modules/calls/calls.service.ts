import { Injectable, Logger } from '@nestjs/common';
import { CallsRepository } from '@/modules/calls/calls.repository';
import { ChatRepository } from '@/modules/chat/chat.repository';
import { CallTimeoutQueueService } from '@/modules/calls/queue/call-timeout-queue.service';
import { CallType, CallStatus } from '@/generated/prisma/enums';

@Injectable()
export class CallsService {
  private readonly logger = new Logger(CallsService.name);

  constructor(
    private callsRepository: CallsRepository,
    private chatRepository: ChatRepository,
    private callTimeoutQueue: CallTimeoutQueueService,
  ) {}

  async initiateCall(data: {
    conversationId: string;
    callerId: string;
    calleeId: string;
    type: CallType;
  }) {
    await this.callsRepository.cleanupStaleSessions();

    const activeCall = await this.callsRepository.findActiveCall(data.calleeId);
    if (activeCall) return { busy: true };

    const callSession = await this.callsRepository.create(data);

    await this.callTimeoutQueue.scheduleTimeout(callSession.id, 30_000);

    return { callSession };
  }

  async acceptCall(callSessionId: string) {
    await this.callTimeoutQueue.cancelTimeout(callSessionId);

    return this.callsRepository.updateStatus(callSessionId, 'ACCEPTED', {
      startedAt: new Date(),
    });
  }

  async endCall(
    callSessionId: string,
    status: CallStatus = 'ENDED',
    endReason = 'normal',
  ) {
    await this.callTimeoutQueue.cancelTimeout(callSessionId);

    const session = await this.callsRepository.findById(callSessionId);
    if (!session) return null;
    if (session.status === 'ENDED' || session.status === 'MISSED') {
      return session;
    }

    const endedAt = new Date();
    const duration = session.startedAt
      ? Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000)
      : 0;

    const updated = await this.callsRepository.updateStatus(
      callSessionId,
      status,
      {
        endedAt,
        duration: duration > 0 ? duration : undefined,
        endReason,
      },
    );

    const contentMap: Record<string, string> = {
      ENDED: `Cuộc gọi ${session.type === 'VIDEO' ? 'video' : 'thoại'} • ${this.formatDuration(duration)}`,
      MISSED: 'Cuộc gọi nhỡ',
      REJECTED: 'Cuộc gọi bị từ chối',
      FAILED: 'Cuộc gọi thất bại',
    };

    const callLogMessage = await this.chatRepository.createMessage({
      conversationId: session.conversationId,
      senderId: session.callerId,
      content: contentMap[status] ?? 'Cuộc gọi đã kết thúc',
      type: 'CALL_LOG',
      callSessionId,
    });

    return {
      ...updated,
      callLogMessage,
      conversationId: session.conversationId,
    };
  }

  async rejectCall(callSessionId: string) {
    return this.endCall(callSessionId, 'REJECTED', 'rejected');
  }

  private formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
}
