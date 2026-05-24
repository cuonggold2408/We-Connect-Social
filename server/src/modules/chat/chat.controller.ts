import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ChatService } from '@/modules/chat/chat.service';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ChatGateway } from '@/modules/chat/chat.gateway';
import { CHAT_EVENTS } from '@/modules/chat/constants/chat.events';
import { PresenceService } from '@/modules/chat/presence/presence.service';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
    private readonly presenceService: PresenceService,
  ) {}

  @Get('conversations')
  async getConversations(@CurrentUser('id') userId: string) {
    return this.chatService.getConversations(userId);
  }

  @Post('conversations')
  async getOrCreateConversation(
    @CurrentUser('id') userId: string,
    @Body('targetUserId') targetUserId: string,
  ) {
    const { conversation, wasCreated } =
      await this.chatService.getOrCreateConversation(userId, targetUserId);

    if (wasCreated && conversation.otherUser) {
      const otherUserId = conversation.otherUser.id;
      this.chatGateway.joinUserToConversation(userId, conversation.id);
      this.chatGateway.joinUserToConversation(otherUserId, conversation.id);
      this.chatGateway.sendToUser(
        otherUserId,
        CHAT_EVENTS.CONVERSATION_CREATED,
        { conversationId: conversation.id },
      );
    }

    return conversation;
  }

  @Get('conversations/:conversationId/messages')
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      conversationId,
      userId,
      cursor,
      limit ? parseInt(limit, 10) : 30,
    );
  }

  @Get('online-friends')
  async getOnlineFriends(@CurrentUser('id') userId: string) {
    const friendIds = await this.chatService.getFriendIds(userId);
    return this.presenceService.getPresenceSnapshot(friendIds);
  }
}
