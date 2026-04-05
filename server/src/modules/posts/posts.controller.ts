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
  ParseUUIDPipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/request/create-post.dto';
import express from 'express';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreatePostDto, @Req() req: express.Request) {
    const userId = req['user'].id as string;
    return this.postsService.createPost(userId, dto);
  }

  @Get('user/:userId/photos')
  async getPhotosByUser(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getPhotosByUser(
      targetUserId,
      currentUserId,
      Number(limit) || 9,
    );
  }

  @Get('user/:userId')
  async getPostsByUser(
    @CurrentUser('id') currentUserId: string,
    @Param('userId', ParseUUIDPipe) targetUserId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.postsService.getPostsByUser(
      targetUserId,
      currentUserId,
      cursor,
      Number(limit) || 10,
    );
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
  async delete(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
  ) {
    const userId = req['user'].id as string;
    await this.postsService.deletePost(userId, id);
  }

  @Get(':id')
  async getById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: express.Request,
  ) {
    const userId = req['user'].id as string;
    return this.postsService.getPostById(userId, id);
  }
}
