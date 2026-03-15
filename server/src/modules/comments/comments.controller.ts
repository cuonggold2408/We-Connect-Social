import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CommentsService } from '@modules/comments/comments.service';
import { CreateCommentDto } from '@modules/comments/dto/request/create-comment.dto';
import { UpdateCommentDto } from '@modules/comments/dto/request/update-comment.dto';
import { Throttle } from '@nestjs/throttler';
import { Request } from '@nestjs/common';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get()
  async getComments(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query('cursor', new ParseUUIDPipe({ optional: true })) cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commentsService.getComments(
      postId,
      cursor,
      Number(limit) || 10,
    );
  }

  @Get(':commentId/replies')
  async getReplies(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Query('cursor', new ParseUUIDPipe({ optional: true })) cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.commentsService.getReplies(
      postId,
      commentId,
      cursor,
      Number(limit) || 5,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].id as string;
    return this.commentsService.createComment(userId, postId, dto);
  }

  @Throttle({
    short: { ttl: 60000, limit: 5 },
    medium: { ttl: 60000, limit: 5 },
    long: { ttl: 60000, limit: 5 },
  })
  @Patch(':commentId')
  async updateComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Body() dto: UpdateCommentDto,
    @Req() req: Request,
  ) {
    const userId = req['user'].id as string;
    return this.commentsService.updateComment(userId, postId, commentId, dto);
  }

  @Delete(':commentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Req() req: Request,
  ) {
    const userId = req['user'].id as string;
    await this.commentsService.deleteComment(userId, postId, commentId);
  }
}
