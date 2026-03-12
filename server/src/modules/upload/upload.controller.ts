import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UploadService } from './upload.service';
import { PresignedUrlRequestDto } from './dto/request/presigned-url-request.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-urls')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async getPresignedUrls(@Body() dto: PresignedUrlRequestDto) {
    return this.uploadService.generatePresignedUrls(dto.files);
  }
}
