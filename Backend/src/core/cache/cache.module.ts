import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Keyv from '@keyv/redis';
import { RolePermissionCacheService } from './role-permission-cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisHost = configService.get<string>('REDIS_HOST', 'localhost');
        const redisPort = configService.get<number>('REDIS_PORT', 6379);
        const cacheTtl = configService.get<number>('CACHE_TTL', 900); // 15 minutes default

        return {
          stores: [new Keyv(`redis://${redisHost}:${redisPort}`)],
          ttl: cacheTtl * 1000, // Convert to milliseconds
        };
      },
    }),
  ],
  providers: [RolePermissionCacheService],
  exports: [RolePermissionCacheService, NestCacheModule],
})
export class CacheModule {}
