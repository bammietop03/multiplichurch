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
import { RolePermissionCacheService } from '../../core/cache/role-permission-cache.service';

// PermissionsGuard is kept for backward-compatibility with @RequirePermissions decorator.
// Since we've simplified to enum-only roles, it delegates to church membership checks.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
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

    // Super admins bypass all permission checks
    if (user.userRole === 'SUPER_ADMIN') {
      return true;
    }

    const churchId =
      request.churchId || request.headers['x-church-id'] || request.params?.id;
    if (churchId) {
      const cached = await this.cacheService.getChurchMemberRole(
        user.id,
        churchId,
      );
      if (!cached.isMember) {
        throw new ForbiddenException('User is not a member of this church');
      }
      // ADMIN can do everything in a church
      if (cached.role === 'ADMIN') {
        return true;
      }
      throw new ForbiddenException(
        'Only church admins can perform this action',
      );
    }

    throw new ForbiddenException('Church context required');
  }
}
