import { Injectable, Logger } from '@nestjs/common';
import {
  StorageProvider,
  StorageUploadOptions,
  StorageFile,
  SignedUrlOptions,
} from './storage.interface';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { R2StorageProvider } from './providers/r2-storage.provider';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private provider: StorageProvider;

  constructor(
    private readonly localProvider: LocalStorageProvider,
    private readonly r2Provider: R2StorageProvider,
  ) {
    this.initializeProvider();
  }

  /**
   * Upload file using configured storage provider
   */
  async upload(file: StorageUploadOptions): Promise<StorageFile> {
    return this.provider.upload(file);
  }

  /**
   * Delete file
   */
  async delete(storagePath: string): Promise<void> {
    return this.provider.delete(storagePath);
  }

  /**
   * Check if file exists
   */
  async exists(storagePath: string): Promise<boolean> {
    return this.provider.exists(storagePath);
  }

  /**
   * Get signed URL (usually for downloads)
   */
  async getSignedUrl(
    storagePath: string,
    options?: SignedUrlOptions,
  ): Promise<string> {
    return this.provider.getSignedUrl(storagePath, options);
  }

  /**
   * Get public URL
   */
  async getUrl(storagePath: string): Promise<string> {
    return this.provider.getUrl(storagePath);
  }

  /**
   * Download file
   */
  async download(storagePath: string): Promise<Buffer> {
    return this.provider.download(storagePath);
  }

  /**
   * Initialize storage provider based on environment
   */
  private initializeProvider(): void {
    const storageType = process.env.STORAGE_TYPE || 'r2';

    switch (storageType) {
      case 'r2':
        this.provider = this.r2Provider;
        this.logger.log('Using Cloudflare R2 storage provider');
        break;
      case 'local':
      default:
        this.provider = this.localProvider;
        this.logger.log('Using local storage provider');
        break;
    }
  }

  /**
   * Get current provider type
   */
  getProviderType(): string {
    if (this.provider instanceof R2StorageProvider) {
      return 'r2';
    }
    return 'local';
  }
}
