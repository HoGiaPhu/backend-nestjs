import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly prefix: string;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.getOrThrow<string>('s3.bucket');
    this.prefix = this.configService.getOrThrow<string>('s3.prefix');

    this.client = new S3Client({
      region: this.configService.getOrThrow<string>('s3.region'),
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('s3.accessKeyId'),
        secretAccessKey:
          this.configService.getOrThrow<string>('s3.secretAccessKey'),
      },
    });
  }

  async uploadPostImage(file: Express.Multer.File): Promise<string> {
    const extension = extname(file.originalname).toLowerCase();
    const key = `${this.prefix}/${randomUUID()}${extension}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return key;
  }

  async getPostImageUrl(key: string): Promise<string> {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
      {
        expiresIn: 60 * 60,
      },
    );
  }

  async deletePostImage(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }
}
