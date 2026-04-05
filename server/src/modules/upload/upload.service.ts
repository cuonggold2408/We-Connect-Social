import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  PutObjectAclCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export type UploadPurpose = 'posts' | 'avatar' | 'cover';

export interface FileMetadata {
  mimeType: string;
  fileSize: number;
}

export interface PresignedUrlResult {
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
    const endpoint = this.config.getOrThrow<string>('S3_ENDPOINT');
    this.bucket = this.config.getOrThrow<string>('S3_BUCKET');

    this.s3 = new S3Client({
      endpoint,
      region: this.config.getOrThrow<string>('S3_REGION'),
      credentials: {
        accessKeyId: this.config.getOrThrow<string>('S3_ACCESS_KEY'),
        secretAccessKey: this.config.getOrThrow<string>('S3_SECRET_KEY'),
      },
      forcePathStyle: true,
    });

    this.publicBaseUrl = `${endpoint}/${this.bucket}`;
  }

  private buildKey(
    userId: string,
    purpose: UploadPurpose,
    ext: string,
  ): string {
    const uuid = randomUUID();
    switch (purpose) {
      case 'avatar':
        return `users/${userId}/avatar/${uuid}.${ext}`;
      case 'cover':
        return `users/${userId}/cover/${uuid}.${ext}`;
      case 'posts':
      default: {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '/');
        return `users/${userId}/posts/${date}/${uuid}.${ext}`;
      }
    }
  }

  async generatePresignedUrls(
    userId: string,
    files: FileMetadata[],
    purpose: UploadPurpose = 'posts',
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
        const key = this.buildKey(userId, purpose, ext);
        const command = new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          ContentType: file.mimeType,
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

  async confirmUploads(keys: string[]): Promise<void> {
    await Promise.all(
      keys.map((key) =>
        this.s3.send(
          new PutObjectAclCommand({
            Bucket: this.bucket,
            Key: key,
            ACL: 'public-read',
          }),
        ),
      ),
    );
  }
}
