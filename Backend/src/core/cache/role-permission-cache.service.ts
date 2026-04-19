import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../database/prisma.service';

export interface CachedChurchMemberRole {
  role: string;
  isMember: boolean;
}

@Injectable()
export class RolePermissionCacheService {
  private readonly logger = new Logger(RolePermissionCacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}

  /**
   * Get church member role (enum value: ADMIN or MEMBER)
   * Cache key: user:{userId}:church:{churchId}:role
   */
  async getChurchMemberRole(
    userId: string,
    churchId: string,
  ): Promise<CachedChurchMemberRole> {
    const cacheKey = `user:${userId}:church:${churchId}:role`;

    try {
      const cached =
        await this.cacheManager.get<CachedChurchMemberRole>(cacheKey);
      if (cached) return cached;

      const member = await this.prisma.churchMember.findUnique({
        where: { churchId_userId: { userId, churchId } },
      });

      const result: CachedChurchMemberRole = {
        role: member?.role ?? '',
        isMember: !!member,
      };

      await this.cacheManager.set(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(`Error getting church member role:`, error);
      const member = await this.prisma.churchMember.findUnique({
        where: { churchId_userId: { userId, churchId } },
      });
      return { role: member?.role ?? '', isMember: !!member };
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    try {
      this.logger.log(`Invalidated user cache for ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating user cache:`, error);
    }
  }

  async invalidateChurchMemberCache(
    userId: string,
    churchId: string,
  ): Promise<void> {
    try {
      await this.cacheManager.del(`user:${userId}:church:${churchId}:role`);
      this.logger.log(
        `Invalidated cache for user ${userId} in church ${churchId}`,
      );
    } catch (error) {
      this.logger.error(`Error invalidating church member cache:`, error);
    }
  }

  async invalidateChurchCache(churchId: string): Promise<void> {
    try {
      const members = await this.prisma.churchMember.findMany({
        where: { churchId },
        select: { userId: true },
      });
      for (const member of members) {
        await this.invalidateChurchMemberCache(member.userId, churchId);
      }
    } catch (error) {
      this.logger.error(`Error invalidating church cache:`, error);
    }
  }
}
