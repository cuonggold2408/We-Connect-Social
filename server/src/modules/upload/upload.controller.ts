import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { UploadService } from './upload.service';
import { PresignedUrlRequestDto } from './dto/request/presigned-url-request.dto';
import { Throttle } from '@nestjs/throttler';
import express from 'express';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-urls')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async getPresignedUrls(
    @Body() dto: PresignedUrlRequestDto,
    @Req() req: express.Request,
  ) {
    const userId = req['user'].id as string;
    return this.uploadService.generatePresignedUrls(userId, dto.files);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirmUploads(@Body() body: { keys: string[] }) {
    await this.uploadService.confirmUploads(body.keys);
  }
}
