import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Query,
  ParseEnumPipe,
} from '@nestjs/common';
import { ReactionsService } from '@modules/reactions/reactions.service';
import { CreateReactionDto } from '@modules/reactions/dto/request/create-reaction.dto';
import express from 'express';
import { ReactionType } from '@/generated/prisma/enums';

@Controller('posts/:postId/reactions')
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Get('stats')
  async getStats(@Param('postId', ParseUUIDPipe) postId: string) {
    return this.reactionsService.getReactionStats(postId);
  }

  @Get()
  async getAllReactionsOfPost(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Query('cursor', new ParseUUIDPipe({ optional: true })) cursor?: string,
    @Query('limit') limit?: string,
    @Query('type', new ParseEnumPipe(ReactionType, { optional: true }))
    type?: ReactionType,
  ) {
    return this.reactionsService.getAllReactionsOfPost(
      postId,
      cursor,
      Number(limit) || 5,
      type,
    );
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async react(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Body() dto: CreateReactionDto,
    @Req() req: express.Request,
  ) {
    const userId = req['user'].id as string;
    return this.reactionsService.react(userId, postId, dto.type);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('postId', ParseUUIDPipe) postId: string,
    @Req() req: express.Request,
  ) {
    const userId = req['user'].id as string;
    await this.reactionsService.removeReaction(userId, postId);
  }
}
