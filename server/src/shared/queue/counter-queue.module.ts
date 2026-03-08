import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@shared/prisma/prisma.module';
import { CounterQueueService } from '@shared/queue/counter-queue.service';
import { CounterQueueProcessor } from '@shared/queue/counter-queue.processor';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [CounterQueueService, CounterQueueProcessor],
  exports: [CounterQueueService],
})
export class CounterQueueModule {}
