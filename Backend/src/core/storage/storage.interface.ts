/**
 * Storage abstraction interfaces
 * Support for multiple storage backends: local, Cloudflare R2, etc.
 */

export interface StorageUploadOptions {
  filename: string;
  mimetype: string;
  size: number;
  buffer?: Buffer;
  path?: string;
}

export interface StorageFile {
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  storagePath: string;
  url?: string;
  uploadedAt: Date;
}

export interface SignedUrlOptions {
  expiresIn?: number; // seconds
}

export abstract class StorageProvider {
  abstract upload(file: StorageUploadOptions): Promise<StorageFile>;

  abstract delete(storagePath: string): Promise<void>;

  abstract exists(storagePath: string): Promise<boolean>;

  abstract getSignedUrl(
    storagePath: string,
    options?: SignedUrlOptions,
  ): Promise<string>;

  abstract getUrl(storagePath: string): Promise<string>;

  abstract download(storagePath: string): Promise<Buffer>;
}
