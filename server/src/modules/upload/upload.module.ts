import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { s3Config } from './s3.config';

@Module({
  imports: [ConfigModule.forFeature(s3Config)],
  controllers: [UploadController],
  providers: [UploadService],
})
export class UploadModule {}
