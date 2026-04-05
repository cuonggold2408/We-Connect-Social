import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { UploadService } from './upload.service';
import { PresignedUrlRequestDto } from './dto/request/presigned-url-request.dto';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '@/shared/decorators/current-user.decorator';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('presigned-urls')
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  async getPresignedUrls(
    @Body() dto: PresignedUrlRequestDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.uploadService.generatePresignedUrls(
      userId,
      dto.files,
      dto.purpose,
    );
  }

  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirmUploads(@Body() body: { keys: string[] }) {
    await this.uploadService.confirmUploads(body.keys);
  }
}
