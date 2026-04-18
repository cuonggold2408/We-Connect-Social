import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Worker } from 'bullmq';
import { CallsRepository } from '@/modules/calls/calls.repository';
import { ChatGateway } from '@/modules/chat/chat.gateway';
import { ChatRepository } from '@/modules/chat/chat.repository';
import { CALL_EVENTS } from '@/modules/calls/constants/call.events';

@Injectable()
export class CallTimeoutQueueProcessor
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(CallTimeoutQueueProcessor.name);
  private worker: Worker;

  constructor(
    private config: ConfigService,
    private callsRepository: CallsRepository,
    private chatRepository: ChatRepository,
    private chatGateway: ChatGateway,
  ) {}

  onModuleInit() {
    this.worker = new Worker(
      'call-timeout',
      async (job: Job<{ callSessionId: string }>) => {
        const { callSessionId } = job.data;

        const session = await this.callsRepository.findById(callSessionId);
        if (!session || session.status !== 'RINGING') return;

        await this.callsRepository.updateStatus(callSessionId, 'MISSED', {
          endedAt: new Date(),
          endReason: 'timeout',
        });

        await this.chatRepository.createMessage({
          conversationId: session.conversationId,
          senderId: session.callerId,
          content: 'Cuộc gọi nhỡ',
          type: 'CALL_LOG',
          callSessionId,
        });

        this.chatGateway.sendToUser(
          session.callerId,
          CALL_EVENTS.CALL_TIMEOUT,
          { callSessionId },
        );
        this.chatGateway.sendToUser(
          session.calleeId,
          CALL_EVENTS.CALL_TIMEOUT,
          { callSessionId },
        );

        this.logger.log(`Call ${callSessionId} timed out (MISSED)`);
      },
      {
        connection: {
          host: this.config.getOrThrow('REDIS_HOST'),
          port: this.config.getOrThrow<number>('REDIS_PORT'),
        },
        concurrency: 3,
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Call timeout job ${job?.id} failed: ${err.message}`);
    });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}
