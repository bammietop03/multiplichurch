import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { RolePermissionCacheService } from '../../core/cache/role-permission-cache.service';
import { MailService } from '../../core/mail/mail.service';
import {
  CreateChurchDto,
  UpdateChurchDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  DirectAddMemberDto,
} from './dto';
import { ChurchRole, UserRole, UserStatus } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChurchesService {
  constructor(
    private prisma: PrismaService,
    private cacheService: RolePermissionCacheService,
    private mailService: MailService,
  ) {}

  async create(userId: string, dto: CreateChurchDto) {
    const existingMembership = await this.prisma.churchMember.findFirst({
      where: { userId },
    });
    if (existingMembership) {
      throw new ConflictException('You already belong to a church');
    }

    const existing = await this.prisma.church.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException('Church with this slug already exists');
    }

    const church = await this.prisma.church.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        members: {
          create: {
            userId,
            role: ChurchRole.ADMIN,
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
          },
        },
      },
    });

    return church;
  }

  async findAll(userId: string) {
    return this.prisma.church.findMany({
      where: {
        deletedAt: null,
        members: { some: { userId } },
      },
      include: {
        members: {
          where: { userId },
        },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin(search?: string) {
    const where: any = { deletedAt: null };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    return this.prisma.church.findMany({
      where,
      include: {
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, userId: string) {
    const church = await this.prisma.church.findFirst({
      where: {
        id,
        deletedAt: null,
        members: { some: { userId } },
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
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!church) {
      throw new NotFoundException('Church not found');
    }

    return church;
  }

  async getMembers(churchId: string, userId: string) {
    const requester = await this.prisma.churchMember.findUnique({
      where: { churchId_userId: { churchId, userId } },
    });

    if (!requester) {
      throw new ForbiddenException('You are not a member of this church');
    }

    return this.prisma.churchMember.findMany({
      where: { churchId },
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
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async getMembersAdmin(churchId: string) {
    return this.prisma.churchMember.findMany({
      where: { churchId },
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
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async update(id: string, userId: string, dto: UpdateChurchDto) {
    await this.checkAdminAccess(id, userId);

    if (dto.slug) {
      const existing = await this.prisma.church.findFirst({
        where: { slug: dto.slug, id: { not: id } },
      });
      if (existing) {
        throw new ConflictException('Church with this slug already exists');
      }
    }

    return this.prisma.church.update({
      where: { id },
      data: { name: dto.name, slug: dto.slug, description: dto.description },
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
          },
        },
      },
    });
  }

  async updateLogo(id: string, userId: string, logoUrl: string) {
    await this.checkAdminAccess(id, userId);

    return this.prisma.church.update({
      where: { id },
      data: { logo: logoUrl },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.checkAdminAccess(id, userId);

    await this.prisma.church.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Church deleted successfully' };
  }

  async sendInvite(churchId: string, inviterId: string, dto: InviteMemberDto) {
    await this.checkAdminAccess(churchId, inviterId);

    const church = await this.prisma.church.findUnique({
      where: { id: churchId },
    });
    if (!church) throw new NotFoundException('Church not found');

    // Check if user is already a member
    const existingMember = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        memberships: { where: { churchId } },
      },
    });

    if (existingMember?.memberships.length) {
      throw new ConflictException('User is already a member of this church');
    }

    // Cancel any existing pending invite for this email+church
    await this.prisma.churchInvite.updateMany({
      where: { churchId, email: dto.email, status: 'PENDING' },
      data: { status: 'EXPIRED' },
    });

    // Create invite record
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await this.prisma.churchInvite.create({
      data: {
        churchId,
        email: dto.email,
        role: dto.role as ChurchRole,
        token,
        invitedBy: inviterId,
        expiresAt,
      },
    });

    // Send invite email
    try {
      await this.mailService.sendChurchInvite(
        dto.email,
        church.name,
        token,
        dto.role,
      );
    } catch (err) {
      console.error('Failed to send invite email:', err);
    }

    return { message: 'Invite sent successfully', inviteId: invite.id };
  }

  async directAddMember(
    churchId: string,
    adminId: string,
    dto: DirectAddMemberDto,
  ) {
    await this.checkAdminAccess(churchId, adminId);

    const church = await this.prisma.church.findUnique({
      where: { id: churchId },
    });
    if (!church) throw new NotFoundException('Church not found');

    // Generate a secure random password
    const rawPassword = crypto
      .randomBytes(10)
      .toString('base64url')
      .slice(0, 12);
    const passwordHash = await bcrypt.hash(rawPassword, 10);

    // Find or create the user
    let user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (user) {
      // User exists — check they're not already a member
      const existing = await this.prisma.churchMember.findUnique({
        where: { churchId_userId: { churchId, userId: user.id } },
      });
      if (existing) {
        throw new ConflictException('User is already a member of this church');
      }
    } else {
      // Create a new account for them
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          passwordHash,
          emailVerified: true,
          emailVerifiedAt: new Date(),
          userRole: UserRole.USER,
          status: UserStatus.ACTIVE,
        },
      });
    }

    // Add to church
    const member = await this.prisma.churchMember.create({
      data: {
        churchId,
        userId: user.id,
        role: dto.role as ChurchRole,
        invitedBy: adminId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    await this.cacheService.invalidateChurchMemberCache(user.id, churchId);

    // Send welcome email with credentials
    try {
      const displayName = dto.firstName || dto.email.split('@')[0];
      await this.mailService.sendWelcomeWithCredentials(
        dto.email,
        displayName,
        rawPassword,
        church.name,
        dto.role,
      );
    } catch (err) {
      console.error('Failed to send welcome credentials email:', err);
    }

    return member;
  }

  async getInviteByToken(token: string) {
    const invite = await this.prisma.churchInvite.findUnique({
      where: { token },
      include: {
        church: { select: { id: true, name: true, slug: true, logo: true } },
      },
    });

    if (!invite) throw new NotFoundException('Invite not found');
    if (invite.status !== 'PENDING')
      throw new BadRequestException('Invite has already been used or expired');
    if (invite.expiresAt < new Date())
      throw new BadRequestException('Invite has expired');

    return invite;
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.getInviteByToken(token);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Verify email matches invite
    if (user.email !== invite.email) {
      throw new ForbiddenException(
        'This invite was sent to a different email address',
      );
    }

    // Check not already a member
    const existing = await this.prisma.churchMember.findUnique({
      where: { churchId_userId: { churchId: invite.churchId, userId } },
    });
    if (existing) {
      throw new ConflictException('You are already a member of this church');
    }

    await this.prisma.$transaction([
      this.prisma.churchMember.create({
        data: {
          churchId: invite.churchId,
          userId,
          role: invite.role,
          invitedBy: invite.invitedBy ?? undefined,
        },
      }),
      this.prisma.churchInvite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED' },
      }),
    ]);

    await this.cacheService.invalidateChurchMemberCache(
      userId,
      invite.churchId,
    );

    return { message: 'Invite accepted successfully', church: invite.church };
  }

  async removeMember(churchId: string, memberId: string, userId: string) {
    await this.checkAdminAccess(churchId, userId);

    const member = await this.prisma.churchMember.findFirst({
      where: { id: memberId, churchId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === ChurchRole.ADMIN) {
      const adminCount = await this.prisma.churchMember.count({
        where: { churchId, role: ChurchRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot remove the last admin');
      }
    }

    await this.prisma.churchMember.delete({ where: { id: memberId } });
    await this.cacheService.invalidateChurchMemberCache(
      member.userId,
      churchId,
    );

    return { message: 'Member removed successfully' };
  }

  async updateMemberRole(
    churchId: string,
    memberId: string,
    userId: string,
    dto: UpdateMemberRoleDto,
  ) {
    await this.checkAdminAccess(churchId, userId);

    const member = await this.prisma.churchMember.findFirst({
      where: { id: memberId, churchId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === ChurchRole.ADMIN && dto.role !== 'ADMIN') {
      const adminCount = await this.prisma.churchMember.count({
        where: { churchId, role: ChurchRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException("Cannot change the last admin's role");
      }
    }

    const updatedMember = await this.prisma.churchMember.update({
      where: { id: memberId },
      data: { role: dto.role as ChurchRole },
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
      },
    });

    await this.cacheService.invalidateChurchMemberCache(
      member.userId,
      churchId,
    );

    return updatedMember;
  }

  async leaveChurch(churchId: string, userId: string) {
    const member = await this.prisma.churchMember.findFirst({
      where: { churchId, userId },
    });

    if (!member) {
      throw new NotFoundException('You are not a member of this church');
    }

    if (member.role === ChurchRole.ADMIN) {
      const adminCount = await this.prisma.churchMember.count({
        where: { churchId, role: ChurchRole.ADMIN },
      });
      if (adminCount <= 1) {
        throw new ForbiddenException(
          'Cannot leave church as the last admin. Transfer admin role or delete the church.',
        );
      }
    }

    await this.prisma.churchMember.delete({ where: { id: member.id } });

    return { message: 'Successfully left the church' };
  }

  private async checkAdminAccess(churchId: string, userId: string) {
    const member = await this.prisma.churchMember.findUnique({
      where: { churchId_userId: { churchId, userId } },
    });

    if (!member || member.role !== ChurchRole.ADMIN) {
      throw new ForbiddenException(
        'Only church admins can perform this action',
      );
    }
  }
}
