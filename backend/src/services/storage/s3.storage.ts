import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import path from 'path';
import { IStorageService } from './storage.interface';

export class S3StorageService implements IStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.bucketName = process.env.AWS_BUCKET_NAME || '';
    this.region = process.env.AWS_REGION || 'us-east-1';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const filename = `receipts/${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );

    // Return the public S3 URL
    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${filename}`;
  }
}
