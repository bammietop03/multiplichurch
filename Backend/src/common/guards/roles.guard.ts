import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../core/database/prisma.service';
import { RolePermissionCacheService } from '../../core/cache/role-permission-cache.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
    private cacheService: RolePermissionCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Get organizationId from request (set by TenantInterceptor) - OPTIONAL
    const organizationId = request.organizationId;

    // MODE 1: Multi-tenant (organization-based roles)
    if (organizationId) {
      // Use cache service
      const cachedMemberRole =
        await this.cacheService.getOrganizationMemberRole(
          user.sub,
          organizationId,
        );

      if (!cachedMemberRole.isMember) {
        throw new ForbiddenException(
          'User is not a member of this organization',
        );
      }

      const hasRole = requiredRoles.some(
        (role) => cachedMemberRole.role === role,
      );

      if (!hasRole) {
        throw new ForbiddenException(
          `User does not have required role in this organization. Required: ${requiredRoles.join(', ')}`,
        );
      }

      // Optionally fetch full membership details if needed by the controller
      const membership = await this.prisma.organizationMember.findFirst({
        where: {
          userId: user.sub,
          organizationId: organizationId,
        },
        include: {
          roleDetails: true,
        },
      });

      request.membership = membership;
      return true;
    }

    // MODE 2: Simple app (direct user roles)
    // Use cache service
    const cachedUserRoles = await this.cacheService.getUserRoles(user.sub);

    if (cachedUserRoles.roleNames.length === 0) {
      throw new ForbiddenException('User has no assigned roles');
    }

    const hasRole = requiredRoles.some((requiredRole) =>
      cachedUserRoles.roleNames.includes(requiredRole),
    );

    if (!hasRole) {
      const userRoleNames = cachedUserRoles.roleNames.join(', ');
      throw new ForbiddenException(
        `User does not have required role. Required: ${requiredRoles.join(', ')}, Has: ${userRoleNames}`,
      );
    }

    return true;
  }
}
