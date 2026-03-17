import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommentsService } from '@modules/comments/comments.service';
import { CreateCommentDto } from '@modules/comments/dto/request/create-comment.dto';
import { UpdateCommentDto } from '@modules/comments/dto/request/update-comment.dto';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async getComments(
    @Param('postId', ParseUUIDPipe) postId: string,
    @CurrentUser('id') userId: string,
    @Query('cursor', new ParseUUIDPipe({ optional: true })) cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);
    return this.commentsService.getComments(
      postId,
      userId,
      cursor,
      parsedLimit,
    );
  }

  @Get(':commentId/replies')
  async getReplies(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser('id') userId: string,
    @Query('cursor', new ParseUUIDPipe({ optional: true })) cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(Math.max(Number(limit) || 5, 1), 50);
    return this.commentsService.getReplies(
      postId,
      commentId,
      userId,
      cursor,
      parsedLimit,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({
    short: { ttl: 60000, limit: 10 },
    medium: { ttl: 60000, limit: 10 },
    long: { ttl: 60000, limit: 10 },
  })
  async createComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.createComment(userId, postId, dto);
  }

  @Patch(':commentId')
  @Throttle({
    short: { ttl: 60000, limit: 5 },
    medium: { ttl: 60000, limit: 5 },
    long: { ttl: 60000, limit: 5 },
  })
  async updateComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.updateComment(userId, postId, commentId, dto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({
    short: { ttl: 60000, limit: 10 },
    medium: { ttl: 60000, limit: 10 },
    long: { ttl: 60000, limit: 10 },
  })
  async deleteComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.commentsService.deleteComment(userId, postId, commentId);
  }
}
