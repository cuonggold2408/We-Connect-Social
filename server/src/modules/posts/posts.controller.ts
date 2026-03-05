import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/request/create-post.dto';
import express from 'express';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePostDto, @Req() req: express.Request) {
    const userId = req['user'].id as string;
    return this.postsService.createPost(userId, dto);
  }

  @Get('feed')
  async getFeed(
    @Req() req: express.Request,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req['user'].id as string;
    return this.postsService.getFeed(userId, cursor, Number(limit) || 10);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string, @Req() req: express.Request) {
    const userId = req['user'].id as string;
    await this.postsService.deletePost(userId, id);
  }
}
