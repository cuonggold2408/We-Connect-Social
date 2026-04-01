import {
  Controller,
  Post,
  Patch,
  Delete,
  Get,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FriendshipsService } from './friendships.service';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';

@Controller('friendships')
export class FriendshipsController {
  constructor(private readonly friendshipsService: FriendshipsService) {}

  @Post('request/:userId')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    short: { ttl: 60000, limit: 20 },
    medium: { ttl: 60000, limit: 20 },
    long: { ttl: 60000, limit: 20 },
  })
  async sendRequest(
    @CurrentUser('id') senderId: string,
    @Param('userId', ParseUUIDPipe) receiverId: string,
  ) {
    return this.friendshipsService.sendRequest(senderId, receiverId);
  }

  @Patch('accept/:userId')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    short: { ttl: 60000, limit: 10 },
    medium: { ttl: 60000, limit: 10 },
    long: { ttl: 60000, limit: 10 },
  })
  async acceptRequest(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) senderId: string,
  ) {
    return this.friendshipsService.acceptRequest(currentUserId, senderId);
  }

  @Patch('reject/:userId')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    short: { ttl: 60000, limit: 10 },
    medium: { ttl: 60000, limit: 10 },
    long: { ttl: 60000, limit: 10 },
  })
  async rejectRequest(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) senderId: string,
  ) {
    return this.friendshipsService.rejectRequest(currentUserId, senderId);
  }

  @Delete('cancel/:userId')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    short: { ttl: 60000, limit: 10 },
    medium: { ttl: 60000, limit: 10 },
    long: { ttl: 60000, limit: 10 },
  })
  async cancelRequest(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) receiverId: string,
  ) {
    return this.friendshipsService.cancelRequest(currentUserId, receiverId);
  }

  @Delete('unfriend/:userId')
  @HttpCode(HttpStatus.OK)
  @Throttle({
    short: { ttl: 60000, limit: 5 },
    medium: { ttl: 60000, limit: 5 },
    long: { ttl: 60000, limit: 5 },
  })
  async unfriend(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) friendId: string,
  ) {
    return this.friendshipsService.unfriend(currentUserId, friendId);
  }

  @Get('requests/received')
  async getReceivedRequests(
    @CurrentUser('id') userId: string,
    @Query('cursor', new ParseUUIDPipe({ optional: true })) cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    return this.friendshipsService.getReceivedRequests(
      userId,
      cursor,
      parsedLimit,
    );
  }

  @Get('requests/sent')
  async getSentRequests(
    @CurrentUser('id') userId: string,
    @Query('cursor', new ParseUUIDPipe({ optional: true })) cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    return this.friendshipsService.getSentRequests(userId, cursor, parsedLimit);
  }

  @Get('requests/received/count')
  async getPendingReceivedCount(@CurrentUser('id') userId: string) {
    const count = await this.friendshipsService.getPendingReceivedCount(userId);
    return { count };
  }

  @Get('friends')
  async getFriends(
    @CurrentUser('id') userId: string,
    @Query('cursor', new ParseUUIDPipe({ optional: true })) cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    return this.friendshipsService.getFriends(userId, cursor, parsedLimit);
  }

  @Get('friends/count')
  async getFriendCount(@CurrentUser('id') userId: string) {
    const count = await this.friendshipsService.getFriendCount(userId);
    return { count };
  }

  @Get('status/:userId')
  async getRelationshipStatus(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
  ) {
    return this.friendshipsService.getRelationshipStatus(
      currentUserId,
      targetUserId,
    );
  }
}
