import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { RolePermissionCacheService } from '../../core/cache/role-permission-cache.service';
import {
  CreateRoleDto,
  UpdateRoleDto,
  AssignPermissionsDto,
  CreatePermissionDto,
  UpdatePermissionDto,
  RolesQueryDto,
  PermissionsQueryDto,
  UserRolesQueryDto,
  AssignRoleToUserDto,
  RemoveRoleFromUserDto,
} from './dto';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private cacheService: RolePermissionCacheService,
  ) {}

  // ============================================
  // ROLE OPERATIONS
  // ============================================

  async createRole(dto: CreateRoleDto) {
    // Check if role name already exists
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Role with this name already exists');
    }

    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        isSystem: false,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
            members: true,
          },
        },
      },
    });

    // If permission IDs provided, assign them
    if (dto.permissionIds && dto.permissionIds.length > 0) {
      await this.assignPermissions(role.id, {
        permissionIds: dto.permissionIds,
      });

      // Re-fetch with updated permissions
      return this.findRoleById(role.id);
    }

    return this.formatRoleResponse(role);
  }

  async findAllRoles(query: RolesQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.includeSystem === false) {
      where.isSystem = false;
    }

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              userRoles: true,
              members: true,
            },
          },
        },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      data: roles.map((role) => this.formatRoleResponse(role)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findRoleById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
            members: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.formatRoleResponse(role);
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem && dto.name && dto.name !== role.name) {
      throw new BadRequestException('Cannot rename system roles');
    }

    // Check for name conflicts
    if (dto.name) {
      const existing = await this.prisma.role.findFirst({
        where: {
          name: dto.name,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException('Role with this name already exists');
      }
    }

    const updated = await this.prisma.role.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
            members: true,
          },
        },
      },
    });

    // Invalidate cache for all users with this role
    await this.invalidateRoleCache(id);

    return this.formatRoleResponse(updated);
  }

  async deleteRole(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            userRoles: true,
            members: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system roles');
    }

    if (role._count.userRoles > 0 || role._count.members > 0) {
      throw new BadRequestException(
        'Cannot delete role with assigned users. Remove all user assignments first.',
      );
    }

    await this.prisma.role.delete({ where: { id } });

    return { message: 'Role deleted successfully' };
  }

  async assignPermissions(roleId: string, dto: AssignPermissionsDto) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Verify all permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: dto.permissionIds } },
    });

    if (permissions.length !== dto.permissionIds.length) {
      throw new BadRequestException('One or more permission IDs are invalid');
    }

    // Remove existing permissions and add new ones (replace strategy)
    await this.prisma.$transaction(async (tx) => {
      // Delete existing permissions
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      // Create new permissions
      await tx.rolePermission.createMany({
        data: dto.permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });
    });

    // Invalidate cache for all users with this role
    await this.invalidateRoleCache(roleId);

    return this.findRoleById(roleId);
  }

  async addPermissionToRole(roleId: string, permissionId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const permission = await this.prisma.permission.findUnique({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    // Check if already assigned
    const existing = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    });

    if (existing) {
      throw new ConflictException('Permission already assigned to this role');
    }

    await this.prisma.rolePermission.create({
      data: { roleId, permissionId },
    });

    await this.invalidateRoleCache(roleId);

    return this.findRoleById(roleId);
  }

  async removePermissionFromRole(roleId: string, permissionId: string) {
    const rolePermission = await this.prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    });

    if (!rolePermission) {
      throw new NotFoundException('Permission not assigned to this role');
    }

    await this.prisma.rolePermission.delete({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    });

    await this.invalidateRoleCache(roleId);

    return this.findRoleById(roleId);
  }

  // ============================================
  // PERMISSION OPERATIONS
  // ============================================

  async createPermission(dto: CreatePermissionDto) {
    // Check if action-resource combination already exists
    const existing = await this.prisma.permission.findUnique({
      where: {
        action_resource: {
          action: dto.action,
          resource: dto.resource,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        'Permission with this action and resource already exists',
      );
    }

    return this.prisma.permission.create({
      data: {
        action: dto.action,
        resource: dto.resource,
        description: dto.description,
      },
    });
  }

  async findAllPermissions(query: PermissionsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.action) {
      where.action = query.action;
    }

    if (query.resource) {
      where.resource = query.resource;
    }

    const [permissions, total] = await Promise.all([
      this.prisma.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ resource: 'asc' }, { action: 'asc' }],
        include: {
          _count: {
            select: {
              roles: true,
            },
          },
        },
      }),
      this.prisma.permission.count({ where }),
    ]);

    return {
      data: permissions.map((p) => ({
        ...p,
        rolesCount: p._count.roles,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPermissionById(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return {
      ...permission,
      roles: permission.roles.map((rp) => rp.role),
    };
  }

  async updatePermission(id: string, dto: UpdatePermissionDto) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return this.prisma.permission.update({
      where: { id },
      data: {
        description: dto.description,
      },
    });
  }

  async deletePermission(id: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            roles: true,
          },
        },
      },
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    if (permission._count.roles > 0) {
      throw new BadRequestException(
        'Cannot delete permission that is assigned to roles. Remove from all roles first.',
      );
    }

    await this.prisma.permission.delete({ where: { id } });

    return { message: 'Permission deleted successfully' };
  }

  // ============================================
  // USER ROLE OPERATIONS
  // ============================================

  async assignRoleToUser(dto: AssignRoleToUserDto) {
    const [user, role] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: dto.userId } }),
      this.prisma.role.findUnique({ where: { id: dto.roleId } }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Check if already assigned
    const existing = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: { userId: dto.userId, roleId: dto.roleId },
      },
    });

    if (existing) {
      throw new ConflictException('User already has this role');
    }

    const userRole = await this.prisma.userRole.create({
      data: {
        userId: dto.userId,
        roleId: dto.roleId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    // Invalidate cache for this user
    await this.cacheService.invalidateUserRoles(dto.userId);

    return userRole;
  }

  async removeRoleFromUser(dto: RemoveRoleFromUserDto) {
    const userRole = await this.prisma.userRole.findUnique({
      where: {
        userId_roleId: { userId: dto.userId, roleId: dto.roleId },
      },
    });

    if (!userRole) {
      throw new NotFoundException('User does not have this role');
    }

    await this.prisma.userRole.delete({
      where: {
        userId_roleId: { userId: dto.userId, roleId: dto.roleId },
      },
    });

    // Invalidate cache for this user
    await this.cacheService.invalidateUserRoles(dto.userId);

    return { message: 'Role removed from user successfully' };
  }

  async getUserRoles(query: UserRolesQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.roleId) {
      where.roleId = query.roleId;
    }

    if (query.search) {
      where.user = {
        OR: [
          { email: { contains: query.search, mode: 'insensitive' } },
          { firstName: { contains: query.search, mode: 'insensitive' } },
          { lastName: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    const [userRoles, total] = await Promise.all([
      this.prisma.userRole.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              status: true,
            },
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      }),
      this.prisma.userRole.count({ where }),
    ]);

    return {
      data: userRoles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUsersWithRole(roleId: string) {
    const role = await this.prisma.role.findUnique({ where: { id: roleId } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return userRoles.map((ur) => ur.user);
  }

  // ============================================
  // STATISTICS
  // ============================================

  async getStatistics() {
    const [
      totalRoles,
      systemRoles,
      customRoles,
      totalPermissions,
      totalUserRoles,
      topRoles,
    ] = await Promise.all([
      this.prisma.role.count(),
      this.prisma.role.count({ where: { isSystem: true } }),
      this.prisma.role.count({ where: { isSystem: false } }),
      this.prisma.permission.count(),
      this.prisma.userRole.count(),
      this.prisma.role.findMany({
        take: 5,
        orderBy: {
          userRoles: {
            _count: 'desc',
          },
        },
        include: {
          _count: {
            select: { userRoles: true },
          },
        },
      }),
    ]);

    return {
      totalRoles,
      systemRoles,
      customRoles,
      totalPermissions,
      totalUserRoles,
      topRoles: topRoles.map((r) => ({
        id: r.id,
        name: r.name,
        usersCount: r._count.userRoles,
      })),
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private formatRoleResponse(role: any) {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((rp: any) => rp.permission),
      usersCount: (role._count?.userRoles || 0) + (role._count?.members || 0),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  private async invalidateRoleCache(roleId: string) {
    // Get all users with this role and invalidate their cache
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true },
    });

    const orgMembers = await this.prisma.organizationMember.findMany({
      where: { roleId },
      select: { userId: true, organizationId: true },
    });

    // Invalidate direct user role caches
    await Promise.all(
      userRoles.map((ur) => this.cacheService.invalidateUserRoles(ur.userId)),
    );

    // Invalidate organization member caches
    await Promise.all(
      orgMembers.map((om) =>
        this.cacheService.invalidateOrganizationMemberRole(
          om.userId,
          om.organizationId,
        ),
      ),
    );
  }
}
