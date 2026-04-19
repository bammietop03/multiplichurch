import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  ROLES_KEY,
  SKIP_CHURCH_CHECK_KEY,
} from '../decorators/roles.decorator';
import { RolePermissionCacheService } from '../../core/cache/role-permission-cache.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
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

    // If the handler is decorated with @SkipChurchCheck(), go straight to
    // global role check (used by admin routes that have a :id param but
    // intentionally skip TenantInterceptor).
    const skipChurchCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_CHURCH_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    const churchId = skipChurchCheck
      ? null
      : request.churchId ||
        request.headers['x-church-id'] ||
        request.params?.id;

    // MODE 1: Church-scoped roles
    if (churchId) {
      const cached = await this.cacheService.getChurchMemberRole(
        user.id,
        churchId,
      );

      if (!cached.isMember) {
        throw new ForbiddenException('User is not a member of this church');
      }

      if (!requiredRoles.includes(cached.role)) {
        throw new ForbiddenException(
          `Insufficient church role. Required: ${requiredRoles.join(' or ')}`,
        );
      }

      return true;
    }

    // MODE 2: Global user role (SUPER_ADMIN / USER)
    if (!user.userRole) {
      throw new ForbiddenException('User has no assigned role');
    }

    if (!requiredRoles.includes(user.userRole)) {
      throw new ForbiddenException(
        `Insufficient role. Required: ${requiredRoles.join(' or ')}`,
      );
    }

    return true;
  }
}
