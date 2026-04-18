import { Module } from '@nestjs/common';
import { CallsService } from '@modules/calls/calls.service';
import { CallsRepository } from '@modules/calls/calls.repository';
import { CallsGateway } from '@modules/calls/calls.gateway';
import { CallTimeoutQueueService } from '@modules/calls/queue/call-timeout-queue.service';
import { CallTimeoutQueueProcessor } from '@modules/calls/queue/call-timeout-queue.processor';
import { ChatModule } from '@modules/chat/chat.module';
import { PrismaModule } from '@/shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule, ChatModule],
  providers: [
    CallsService,
    CallsRepository,
    CallsGateway,
    CallTimeoutQueueService,
    CallTimeoutQueueProcessor,
  ],
})
export class CallsModule {}
