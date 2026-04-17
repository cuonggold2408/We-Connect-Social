import { Module } from '@nestjs/common';
import { ChatController } from '@modules/chat/chat.controller';
import { ChatService } from '@modules/chat/chat.service';
import { ChatRepository } from '@modules/chat/chat.repository';
import { ChatGateway } from '@modules/chat/chat.gateway';
import { PrismaModule } from '@/shared/prisma/prisma.module';
import { FriendshipsModule } from '@modules/friendships/friendships.module';

@Module({
  imports: [PrismaModule, FriendshipsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatRepository, ChatGateway],
  exports: [ChatService, ChatGateway, ChatRepository],
})
export class ChatModule {}
