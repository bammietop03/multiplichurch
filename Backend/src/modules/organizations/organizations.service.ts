import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { RolePermissionCacheService } from '../../core/cache/role-permission-cache.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './dto';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    private cacheService: RolePermissionCacheService,
  ) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    // Check if organization with slug already exists
    const existing = await this.prisma.organization.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Organization with this slug already exists');
    }

    // Get the Owner role
    const ownerRole = await this.prisma.role.findFirst({
      where: { name: 'Owner' },
    });

    if (!ownerRole) {
      throw new Error('Owner role not found in database');
    }

    // Create organization and add creator as owner
    const organization = await this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        members: {
          create: {
            userId: userId,
            roleId: ownerRole.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            roleDetails: true,
          },
        },
      },
    });

    return organization;
  }

  async findAll(userId: string) {
    const organizations = await this.prisma.organization.findMany({
      where: {
        deletedAt: null,
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          where: {
            userId: userId,
          },
          include: {
            roleDetails: true,
          },
        },
        _count: {
          select: {
            members: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return organizations;
  }

  async findOne(id: string, userId: string) {
    const organization = await this.prisma.organization.findFirst({
      where: {
        id,
        deletedAt: null,
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
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
            roleDetails: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, userId: string, dto: UpdateOrganizationDto) {
    // Check if user is owner or admin
    await this.checkAdminAccess(id, userId);

    // If slug is being updated, check for conflicts
    if (dto.slug) {
      const existing = await this.prisma.organization.findFirst({
        where: {
          slug: dto.slug,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          'Organization with this slug already exists',
        );
      }
    }

    const organization = await this.prisma.organization.update({
      where: { id },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            roleDetails: true,
          },
        },
      },
    });

    return organization;
  }

  async remove(id: string, userId: string) {
    // Check if user is owner
    await this.checkOwnerAccess(id, userId);

    // Soft delete
    await this.prisma.organization.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Organization deleted successfully' };
  }

  async inviteMember(
    organizationId: string,
    userId: string,
    dto: InviteMemberDto,
  ) {
    // Check if user is owner or admin
    await this.checkAdminAccess(organizationId, userId);

    // Check if invitee exists
    const invitee = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!invitee) {
      throw new NotFoundException('User with this email not found');
    }

    // Check if already a member
    const existingMember = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: invitee.id,
      },
    });

    if (existingMember) {
      throw new ConflictException(
        'User is already a member of this organization',
      );
    }

    // Get role
    const role = await this.prisma.role.findFirst({
      where: { name: dto.role },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Add member
    const member = await this.prisma.organizationMember.create({
      data: {
        organizationId,
        userId: invitee.id,
        roleId: role.id,
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
        roleDetails: true,
      },
    });

    // TODO: Send invitation email

    // Invalidate cache for the newly added member
    await this.cacheService.invalidateOrganizationMemberCache(
      invitee.id,
      organizationId,
    );

    return member;
  }

  async removeMember(organizationId: string, memberId: string, userId: string) {
    // Check if user is owner or admin
    await this.checkAdminAccess(organizationId, userId);

    const member = await this.prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
      include: {
        roleDetails: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Prevent removing the last owner
    if (member.roleDetails.name === 'Owner') {
      const ownerCount = await this.prisma.organizationMember.count({
        where: {
          organizationId,
          roleDetails: {
            name: 'Owner',
          },
        },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException('Cannot remove the last owner');
      }
    }

    await this.prisma.organizationMember.delete({
      where: { id: memberId },
    });

    // Invalidate cache for the removed member
    await this.cacheService.invalidateOrganizationMemberCache(
      member.userId,
      organizationId,
    );

    return { message: 'Member removed successfully' };
  }

  async updateMemberRole(
    organizationId: string,
    memberId: string,
    userId: string,
    dto: UpdateMemberRoleDto,
  ) {
    // Check if user is owner or admin
    await this.checkAdminAccess(organizationId, userId);

    const member = await this.prisma.organizationMember.findFirst({
      where: {
        id: memberId,
        organizationId,
      },
      include: {
        roleDetails: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Get new role
    const newRole = await this.prisma.role.findFirst({
      where: { name: dto.role },
    });

    if (!newRole) {
      throw new NotFoundException('Role not found');
    }

    // Prevent changing the last owner's role
    if (member.roleDetails.name === 'Owner' && dto.role !== 'Owner') {
      const ownerCount = await this.prisma.organizationMember.count({
        where: {
          organizationId,
          roleDetails: {
            name: 'Owner',
          },
        },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException("Cannot change the last owner's role");
      }
    }

    const updatedMember = await this.prisma.organizationMember.update({
      where: { id: memberId },
      data: {
        roleId: newRole.id,
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
        roleDetails: true,
      },
    });

    // Invalidate cache for the member whose role was updated
    await this.cacheService.invalidateOrganizationMemberCache(
      member.userId,
      organizationId,
    );

    return updatedMember;
  }

  async leavOrganization(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
      },
      include: {
        roleDetails: true,
      },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this organization');
    }

    // Prevent last owner from leaving
    if (member.roleDetails.name === 'Owner') {
      const ownerCount = await this.prisma.organizationMember.count({
        where: {
          organizationId,
          roleDetails: {
            name: 'Owner',
          },
        },
      });

      if (ownerCount <= 1) {
        throw new ForbiddenException(
          'Cannot leave organization as the last owner. Transfer ownership or delete the organization.',
        );
      }
    }

    await this.prisma.organizationMember.delete({
      where: { id: member.id },
    });

    return { message: 'Successfully left the organization' };
  }

  private async checkOwnerAccess(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
      },
      include: {
        roleDetails: true,
      },
    });

    if (!member || member.roleDetails.name !== 'Owner') {
      throw new ForbiddenException(
        'Only organization owners can perform this action',
      );
    }
  }

  private async checkAdminAccess(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId,
      },
      include: {
        roleDetails: true,
      },
    });

    if (!member || !['Owner', 'Admin'].includes(member.roleDetails.name)) {
      throw new ForbiddenException(
        'Only organization owners and admins can perform this action',
      );
    }
  }
}
