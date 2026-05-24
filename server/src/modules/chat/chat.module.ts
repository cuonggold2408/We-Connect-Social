import { Module } from '@nestjs/common';
import { ChatController } from '@modules/chat/chat.controller';
import { ChatService } from '@modules/chat/chat.service';
import { ChatRepository } from '@modules/chat/chat.repository';
import { ChatGateway } from '@modules/chat/chat.gateway';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { FriendshipsModule } from '@modules/friendships/friendships.module';
import { PresenceReconciler } from '@/modules/chat/presence/presence.reconciler';
import { PresenceService } from '@/modules/chat/presence/presence.service';

@Module({
  imports: [PrismaModule, FriendshipsModule],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatRepository,
    ChatGateway,
    PresenceService,
    PresenceReconciler,
  ],
  exports: [ChatService, ChatGateway, ChatRepository, PresenceService],
})
export class ChatModule {}
