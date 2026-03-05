import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { nanoid } from 'nanoid';
import {
  StorageProvider,
  StorageUploadOptions,
  StorageFile,
  SignedUrlOptions,
} from '../storage.interface';

@Injectable()
export class R2StorageProvider extends StorageProvider {
  private readonly logger = new Logger(R2StorageProvider.name);
  private readonly s3Client: S3Client;
  private readonly bucket: string;
  private readonly accountId: string;
  private readonly publicUrl?: string;

  constructor() {
    super();

    // Validate required environment variables
    const accountId = process.env.R2_ACCOUNT_ID;
    const bucketName = process.env.R2_BUCKET_NAME;

    if (!accountId) {
      throw new Error('R2_ACCOUNT_ID environment variable is required');
    }

    if (!bucketName) {
      throw new Error('R2_BUCKET_NAME environment variable is required');
    }

    this.accountId = accountId;
    this.bucket = bucketName;

    // Optional: Public bucket URL for direct access (if configured)
    this.publicUrl = process.env.R2_PUBLIC_URL;

    // Configure S3 client for Cloudflare R2
    // R2 is S3-compatible, so we use the AWS SDK v3
    this.s3Client = new S3Client({
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      region: 'auto',
      forcePathStyle: false,
    });

    this.logger.log(
      `R2 Storage initialized for account: ${this.accountId}, bucket: ${this.bucket}`,
    );
  }

  /**
   * Upload file to Cloudflare R2
   */
  async upload(file: StorageUploadOptions): Promise<StorageFile> {
    try {
      const id = nanoid();
      const filename = `${id}-${file.filename}`;
      const key = `uploads/${filename}`;

      const buffer = file.buffer || (await this.readFile(file.path!));

      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: file.mimetype,
        Metadata: {
          'original-name': file.filename,
        },
      });

      await this.s3Client.send(command);

      const url = this.getPublicUrl(key);

      this.logger.log(`File uploaded successfully: ${key}`);

      return {
        filename,
        originalName: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        storagePath: key,
        url,
        uploadedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to upload file to R2', error);
      throw error;
    }
  }

  /**
   * Delete file from R2
   */
  async delete(storagePath: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted successfully: ${storagePath}`);
    } catch (error) {
      this.logger.error(`Failed to delete file at ${storagePath}`, error);
      throw error;
    }
  }

  /**
   * Check if file exists in R2
   */
  async exists(storagePath: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if ((error as any).name === 'NotFound') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get signed URL for R2
   * Signed URLs are useful for temporary access to private files
   */
  async getSignedUrl(
    storagePath: string,
    options?: SignedUrlOptions,
  ): Promise<string> {
    try {
      const expiresIn = options?.expiresIn || 3600; // Default 1 hour

      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      return url;
    } catch (error) {
      this.logger.error('Failed to generate signed URL', error);
      throw error;
    }
  }

  /**
   * Get public URL
   * If R2_PUBLIC_URL is configured, use custom domain
   * Otherwise, use R2's default endpoint
   */
  async getUrl(storagePath: string): Promise<string> {
    return this.getPublicUrl(storagePath);
  }

  /**
   * Download file from R2
   */
  async download(storagePath: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storagePath,
      });

      const result = await this.s3Client.send(command);

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of result.Body as any) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    } catch (error) {
      this.logger.error(`Failed to download file at ${storagePath}`, error);
      throw error;
    }
  }

  /**
   * Helper: Generate public URL
   * Uses custom domain if configured, otherwise R2 endpoint
   */
  private getPublicUrl(key: string): string {
    if (this.publicUrl) {
      // Use custom domain if configured (e.g., https://cdn.example.com)
      return `${this.publicUrl}/${key}`;
    }

    // Use R2's public bucket URL format
    // Note: Bucket must be configured as public in R2 dashboard for this to work
    return `https://pub-${this.accountId}.r2.dev/${this.bucket}/${key}`;
  }

  /**
   * Helper: Read file from filesystem
   */
  private async readFile(path: string): Promise<Buffer> {
    const fs = await import('fs/promises');
    return fs.readFile(path);
  }
}
