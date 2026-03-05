import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LocalStorageProvider } from './providers/local-storage.provider';
import { R2StorageProvider } from './providers/r2-storage.provider';

@Module({
  providers: [StorageService, LocalStorageProvider, R2StorageProvider],
  exports: [StorageService],
})
export class StorageModule {}
