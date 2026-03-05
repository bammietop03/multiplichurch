import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { nanoid } from 'nanoid';
import {
  StorageProvider,
  StorageUploadOptions,
  StorageFile,
  SignedUrlOptions,
} from '../storage.interface';

@Injectable()
export class LocalStorageProvider extends StorageProvider {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly uploadDir = process.env.UPLOAD_DIR || './uploads';

  constructor() {
    super();
    this.ensureUploadDir();
  }

  /**
   * Upload file to local storage
   */
  async upload(file: StorageUploadOptions): Promise<StorageFile> {
    try {
      const id = nanoid();
      const ext = this.getFileExtension(file.filename);
      const filename = `${id}${ext}`;
      const storagePath = `${this.uploadDir}/${filename}`;

      // Create directory if not exists
      await fs.mkdir(this.uploadDir, { recursive: true });

      // Write file
      if (file.buffer) {
        await fs.writeFile(storagePath, file.buffer);
      } else if (file.path) {
        await fs.copyFile(file.path, storagePath);
      } else {
        throw new Error('Either buffer or path must be provided');
      }

      return {
        filename,
        originalName: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        storagePath,
        url: `/files/${filename}`,
        uploadedAt: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to upload file', error);
      throw error;
    }
  }

  /**
   * Delete file from local storage
   */
  async delete(storagePath: string): Promise<void> {
    try {
      const fullPath = this.getFullPath(storagePath);
      await fs.unlink(fullPath);
    } catch (error) {
      this.logger.error(`Failed to delete file at ${storagePath}`, error);
      throw error;
    }
  }

  /**
   * Check if file exists
   */
  async exists(storagePath: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(storagePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get signed URL (for local storage, just returns regular URL with expiry)
   */
  async getSignedUrl(
    storagePath: string,
    options?: SignedUrlOptions,
  ): Promise<string> {
    // Local storage doesn't support actual signed URLs
    // Return a URL with timestamp for simplicity
    const expiresIn = options?.expiresIn || 3600;
    const expiresAt = Date.now() + expiresIn * 1000;

    return `/files/${this.getFileName(storagePath)}?expires=${expiresAt}`;
  }

  /**
   * Get public URL
   */
  async getUrl(storagePath: string): Promise<string> {
    return `/files/${this.getFileName(storagePath)}`;
  }

  /**
   * Download file
   */
  async download(storagePath: string): Promise<Buffer> {
    try {
      const fullPath = this.getFullPath(storagePath);
      return await fs.readFile(fullPath);
    } catch (error) {
      this.logger.error(`Failed to download file at ${storagePath}`, error);
      throw error;
    }
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create upload directory', error);
    }
  }

  /**
   * Get full file path
   */
  private getFullPath(storagePath: string): string {
    // If already full path, return as is
    if (path.isAbsolute(storagePath)) {
      return storagePath;
    }
    return path.join(process.cwd(), storagePath);
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    const ext = path.extname(filename);
    return ext || '';
  }

  /**
   * Get filename from storage path
   */
  private getFileName(storagePath: string): string {
    return path.basename(storagePath);
  }
}
