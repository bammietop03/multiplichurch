import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../database/prisma.service';

export interface CachedUserRole {
  roleNames: string[];
}

export interface CachedUserPermissions {
  permissions: Array<{
    action: string;
    resource: string;
  }>;
  hasManageAll: boolean;
}

export interface CachedOrganizationMemberRole {
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
   * Get user roles for simple mode (non-multi-tenant)
   * Caches result with key: user:{userId}:roles
   */
  async getUserRoles(userId: string): Promise<CachedUserRole> {
    const cacheKey = `user:${userId}:roles`;

    try {
      // Try to get from cache
      const cached = await this.cacheManager.get<CachedUserRole>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for ${cacheKey}`);
        return cached;
      }

      // Cache miss - fetch from database
      this.logger.debug(`Cache miss for ${cacheKey}, fetching from database`);
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });

      const result: CachedUserRole = {
        roleNames: userRoles.map((ur) => ur.role.name),
      };

      // Store in cache
      await this.cacheManager.set(cacheKey, result);
      this.logger.debug(`Cached ${cacheKey}`);

      return result;
    } catch (error) {
      this.logger.error(`Error getting user roles for user ${userId}:`, error);
      // Fallback to database query without caching
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: { role: true },
      });
      return { roleNames: userRoles.map((ur) => ur.role.name) };
    }
  }

  /**
   * Get user permissions for simple mode (non-multi-tenant)
   * Caches result with key: user:{userId}:permissions
   */
  async getUserPermissions(userId: string): Promise<CachedUserPermissions> {
    const cacheKey = `user:${userId}:permissions`;

    try {
      // Try to get from cache
      const cached =
        await this.cacheManager.get<CachedUserPermissions>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for ${cacheKey}`);
        return cached;
      }

      // Cache miss - fetch from database
      this.logger.debug(`Cache miss for ${cacheKey}, fetching from database`);
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      // Flatten permissions from all roles
      const permissionsSet = new Set<string>();
      let hasManageAll = false;

      for (const userRole of userRoles) {
        for (const rolePermission of userRole.role.permissions) {
          const permKey = `${rolePermission.permission.action}:${rolePermission.permission.resource}`;
          permissionsSet.add(permKey);

          if (
            rolePermission.permission.action === 'MANAGE' &&
            rolePermission.permission.resource === 'ALL'
          ) {
            hasManageAll = true;
          }
        }
      }

      const result: CachedUserPermissions = {
        permissions: Array.from(permissionsSet).map((permKey) => {
          const [action, resource] = permKey.split(':');
          return { action, resource };
        }),
        hasManageAll,
      };

      // Store in cache
      await this.cacheManager.set(cacheKey, result);
      this.logger.debug(`Cached ${cacheKey}`);

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting user permissions for user ${userId}:`,
        error,
      );
      // Fallback to database query without caching
      const userRoles = await this.prisma.userRole.findMany({
        where: { userId },
        include: {
          role: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      const permissionsSet = new Set<string>();
      let hasManageAll = false;

      for (const userRole of userRoles) {
        for (const rolePermission of userRole.role.permissions) {
          const permKey = `${rolePermission.permission.action}:${rolePermission.permission.resource}`;
          permissionsSet.add(permKey);

          if (
            rolePermission.permission.action === 'MANAGE' &&
            rolePermission.permission.resource === 'ALL'
          ) {
            hasManageAll = true;
          }
        }
      }

      return {
        permissions: Array.from(permissionsSet).map((permKey) => {
          const [action, resource] = permKey.split(':');
          return { action, resource };
        }),
        hasManageAll,
      };
    }
  }

  /**
   * Get organization member role for multi-tenant mode
   * Caches result with key: user:{userId}:org:{organizationId}:role
   */
  async getOrganizationMemberRole(
    userId: string,
    organizationId: string,
  ): Promise<CachedOrganizationMemberRole> {
    const cacheKey = `user:${userId}:org:${organizationId}:role`;

    try {
      // Try to get from cache
      const cached =
        await this.cacheManager.get<CachedOrganizationMemberRole>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for ${cacheKey}`);
        return cached;
      }

      // Cache miss - fetch from database
      this.logger.debug(`Cache miss for ${cacheKey}, fetching from database`);
      const member = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            userId,
            organizationId,
          },
        },
        include: { roleDetails: true },
      });

      const result: CachedOrganizationMemberRole = {
        role: member?.roleDetails?.name || '',
        isMember: !!member,
      };

      // Store in cache
      await this.cacheManager.set(cacheKey, result);
      this.logger.debug(`Cached ${cacheKey}`);

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting organization member role for user ${userId}, org ${organizationId}:`,
        error,
      );
      // Fallback to database query without caching
      const member = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            userId,
            organizationId,
          },
        },
        include: { roleDetails: true },
      });

      return {
        role: member?.roleDetails?.name || '',
        isMember: !!member,
      };
    }
  }

  /**
   * Get organization member permissions for multi-tenant mode
   * Caches result with key: user:{userId}:org:{organizationId}:permissions
   */
  async getOrganizationMemberPermissions(
    userId: string,
    organizationId: string,
  ): Promise<CachedUserPermissions> {
    const cacheKey = `user:${userId}:org:${organizationId}:permissions`;

    try {
      // Try to get from cache
      const cached =
        await this.cacheManager.get<CachedUserPermissions>(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for ${cacheKey}`);
        return cached;
      }

      // Cache miss - fetch from database
      this.logger.debug(`Cache miss for ${cacheKey}, fetching from database`);
      const member = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            userId,
            organizationId,
          },
        },
        include: {
          roleDetails: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      if (!member || !member.roleDetails) {
        const emptyResult: CachedUserPermissions = {
          permissions: [],
          hasManageAll: false,
        };
        await this.cacheManager.set(cacheKey, emptyResult);
        return emptyResult;
      }

      const permissions = member.roleDetails.permissions.map((rp) => ({
        action: rp.permission.action,
        resource: rp.permission.resource,
      }));

      const hasManageAll = member.roleDetails.permissions.some(
        (rp) =>
          rp.permission.action === 'MANAGE' && rp.permission.resource === 'ALL',
      );

      const result: CachedUserPermissions = {
        permissions,
        hasManageAll,
      };

      // Store in cache
      await this.cacheManager.set(cacheKey, result);
      this.logger.debug(`Cached ${cacheKey}`);

      return result;
    } catch (error) {
      this.logger.error(
        `Error getting organization member permissions for user ${userId}, org ${organizationId}:`,
        error,
      );
      // Fallback to database query without caching
      const member = await this.prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            userId,
            organizationId,
          },
        },
        include: {
          roleDetails: {
            include: {
              permissions: {
                include: { permission: true },
              },
            },
          },
        },
      });

      if (!member || !member.roleDetails) {
        return {
          permissions: [],
          hasManageAll: false,
        };
      }

      const permissions = member.roleDetails.permissions.map((rp) => ({
        action: rp.permission.action,
        resource: rp.permission.resource,
      }));

      const hasManageAll = member.roleDetails.permissions.some(
        (rp) =>
          rp.permission.action === 'MANAGE' && rp.permission.resource === 'ALL',
      );

      return {
        permissions,
        hasManageAll,
      };
    }
  }

  /**
   * Invalidate all cache entries for a specific user
   * Clears both simple mode and multi-tenant mode caches
   */
  async invalidateUserCache(userId: string): Promise<void> {
    try {
      // Clear simple mode caches
      await this.cacheManager.del(`user:${userId}:roles`);
      await this.cacheManager.del(`user:${userId}:permissions`);

      // Note: Organization-specific caches would need organizationId
      // These will be invalidated separately when needed
      this.logger.log(`Invalidated cache for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error invalidating cache for user ${userId}:`, error);
    }
  }

  /**
   * Invalidate user roles cache (simple mode)
   */
  async invalidateUserRoles(userId: string): Promise<void> {
    try {
      await this.cacheManager.del(`user:${userId}:roles`);
      await this.cacheManager.del(`user:${userId}:permissions`);
      this.logger.log(`Invalidated user roles cache for user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error invalidating user roles cache for user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Invalidate organization member role cache
   */
  async invalidateOrganizationMemberRole(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    try {
      await this.cacheManager.del(`user:${userId}:org:${organizationId}:role`);
      await this.cacheManager.del(
        `user:${userId}:org:${organizationId}:permissions`,
      );
      this.logger.log(
        `Invalidated organization member role cache for user ${userId} in org ${organizationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error invalidating organization member role cache for user ${userId}, org ${organizationId}:`,
        error,
      );
    }
  }

  /**
   * Invalidate cache for a specific user in an organization
   */
  async invalidateOrganizationMemberCache(
    userId: string,
    organizationId: string,
  ): Promise<void> {
    try {
      await this.cacheManager.del(`user:${userId}:org:${organizationId}:role`);
      await this.cacheManager.del(
        `user:${userId}:org:${organizationId}:permissions`,
      );
      this.logger.log(
        `Invalidated cache for user ${userId} in organization ${organizationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error invalidating organization member cache for user ${userId}, org ${organizationId}:`,
        error,
      );
    }
  }

  /**
   * Invalidate all cache entries for all members of an organization
   * Use this when role definitions or permissions change
   */
  async invalidateOrganizationCache(organizationId: string): Promise<void> {
    try {
      // Get all members of the organization
      const members = await this.prisma.organizationMember.findMany({
        where: { organizationId },
        select: { userId: true },
      });

      // Invalidate cache for each member
      for (const member of members) {
        await this.invalidateOrganizationMemberCache(
          member.userId,
          organizationId,
        );
      }

      this.logger.log(
        `Invalidated cache for all members of organization ${organizationId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error invalidating organization cache for org ${organizationId}:`,
        error,
      );
    }
  }
}
