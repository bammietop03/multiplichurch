import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  Permission,
} from '../decorators/permissions.decorator';
import { PrismaService } from '../../core/database/prisma.service';
import { RolePermissionCacheService } from '../../core/cache/role-permission-cache.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private cacheService: RolePermissionCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get organizationId from request (set by TenantInterceptor) - OPTIONAL
    const organizationId = request.organizationId;

    // MODE 1: Multi-tenant (organization-based permissions)
    if (organizationId) {
      // Use cache service
      const cachedPermissions =
        await this.cacheService.getOrganizationMemberPermissions(
          user.sub,
          organizationId,
        );

      if (cachedPermissions.permissions.length === 0) {
        throw new ForbiddenException(
          'User is not a member of this organization',
        );
      }

      // Check for super admin permission first
      if (cachedPermissions.hasManageAll) {
        return true;
      }

      // Check if user has all required permissions
      const hasAllPermissions = requiredPermissions.every((required) =>
        cachedPermissions.permissions.some(
          (userPerm) =>
            userPerm.action === required.action &&
            userPerm.resource === required.resource,
        ),
      );

      if (!hasAllPermissions) {
        throw new ForbiddenException(
          'User does not have required permissions for this action',
        );
      }

      // Optionally fetch full membership details if needed by the controller
      const membership = await this.prisma.organizationMember.findFirst({
        where: {
          userId: user.sub,
          organizationId: organizationId,
        },
        include: {
          roleDetails: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      request.membership = membership;
      return true;
    }

    // MODE 2: Simple app (direct user permissions)
    // Use cache service
    const cachedPermissions = await this.cacheService.getUserPermissions(
      user.sub,
    );

    if (cachedPermissions.permissions.length === 0) {
      throw new ForbiddenException('User has no assigned roles');
    }

    // Check for super admin permission first
    if (cachedPermissions.hasManageAll) {
      return true;
    }

    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every((required) =>
      cachedPermissions.permissions.some(
        (userPerm) =>
          userPerm.action === required.action &&
          userPerm.resource === required.resource,
      ),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(
        'User does not have required permissions for this action',
      );
    }

    return true;
  }
}
