import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import { CommentReactionsService } from './comment-reactions.service';
import { CreateCommentReactionDto } from './dto/request/create-comment-reaction.dto';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';
import { ReactionType } from '@/generated/prisma/enums';
import { Throttle } from '@nestjs/throttler';

@Controller('comments/:commentId/reactions')
export class CommentReactionsController {
  constructor(
    private readonly commentReactionsService: CommentReactionsService,
  ) {}

  @Get('stats')
  async getStats(@Param('commentId', ParseUUIDPipe) commentId: string) {
    return this.commentReactionsService.getReactionStats(commentId);
  }

  @Get()
  async getAll(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query('cursor', new ParseUUIDPipe({ optional: true })) cursor?: string,
    @Query('limit') limit?: string,
    @Query('type', new ParseEnumPipe(ReactionType, { optional: true }))
    type?: ReactionType,
  ) {
    return this.commentReactionsService.getAllReactions(
      commentId,
      cursor,
      Number(limit) || 5,
      type,
    );
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  @Throttle({
    short: { ttl: 60000, limit: 30 },
    medium: { ttl: 60000, limit: 30 },
    long: { ttl: 60000, limit: 30 },
  })
  async react(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: CreateCommentReactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentReactionsService.react(userId, commentId, dto.type);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.commentReactionsService.removeReaction(userId, commentId);
  }
}
