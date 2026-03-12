import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

interface FileMetadata {
  mimeType: string;
  fileSize: number;
}

interface PresignedUrlResult {
  uploadUrl: string;
  objectUrl: string;
  key: string;
}

@Injectable()
export class UploadService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;

  constructor(private config: ConfigService) {
    const endpoint = this.config.getOrThrow<string>('s3.endpoint');
    this.bucket = this.config.getOrThrow<string>('s3.bucket');

    this.s3 = new S3Client({
      endpoint,
      region: this.config.getOrThrow<string>('s3.region'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('s3.accessKeyId'),
        secretAccessKey: this.config.getOrThrow<string>('s3.secretAccessKey'),
      },
      forcePathStyle: true,
    });

    this.publicBaseUrl = `${endpoint}/${this.bucket}`;
  }

  async generatePresignedUrls(
    files: FileMetadata[],
  ): Promise<PresignedUrlResult[]> {
    const MIME_TO_EXT: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
    };

    return Promise.all(
      files.map(async (file) => {
        const ext = MIME_TO_EXT[file.mimeType] || 'jpg';
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
        const key = `posts/${date}/${randomUUID()}.${ext}`;

        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: file.mimeType,
          ContentLength: file.fileSize,
        });

        const uploadUrl = await getSignedUrl(this.s3, command, {
          expiresIn: 300,
        });

        return {
          uploadUrl,
          objectUrl: `${this.publicBaseUrl}/${key}`,
          key,
        };
      }),
    );
  }
}
