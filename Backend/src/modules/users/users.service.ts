import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/database/prisma.service';
import { UpdateProfileDto, UpdatePasswordDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        emailVerified: true,
        status: true,
        userRole: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        memberships: {
          select: {
            id: true,
            churchId: true,
            role: true,
            church: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      ...user,
      churches: user.memberships.map((m) => ({
        ...m.church,
        membershipId: m.id,
        role: m.role,
      })),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Check if email is being updated and if it's already taken
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          id: { not: userId },
        },
      });

      if (existing) {
        throw new ConflictException('Email already in use');
      }

      // If email is changed, mark as unverified
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...dto,
          emailVerified: false,
          emailVerificationToken: null,
          emailVerificationExpiry: null,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          emailVerified: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // TODO: Send new verification email

      return user;
    }

    // Update other fields
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        emailVerified: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
      },
    });

    // Revoke all refresh tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Password updated successfully. Please login again.' };
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatar: avatarUrl,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });

    return user;
  }

  async deactivateAccount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'INACTIVE',
      },
    });

    // Revoke all tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Account deactivated successfully' };
  }

  async exportData(userId: string) {
    // Get all user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberships: {
          include: {
            church: true,
          },
        },
        refreshTokens: {
          select: {
            createdAt: true,
            expiresAt: true,
          },
        },
        auditLogs: {
          take: 100,
          orderBy: {
            createdAt: 'desc',
          },
        },
        files: {
          select: {
            id: true,
            filename: true,
            mimeType: true,
            size: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove sensitive data
    const {
      passwordHash,
      emailVerificationToken,
      passwordResetToken,
      ...userData
    } = user;

    return {
      exportedAt: new Date().toISOString(),
      user: userData,
    };
  }

  async deleteAccount(userId: string) {
    // Soft delete user
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    });

    // Revoke all tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    // Remove from churches
    await this.prisma.churchMember.deleteMany({
      where: { userId },
    });

    // Anonymize audit logs (keep for compliance)
    await this.prisma.auditLog.updateMany({
      where: { userId },
      data: {
        metadata: {
          anonymized: true,
        },
      },
    });

    return {
      message: 'Account deleted successfully. Your data has been anonymized.',
    };
  }

  async getChurches(userId: string) {
    const memberships = await this.prisma.churchMember.findMany({
      where: {
        userId,
        church: {
          deletedAt: null,
        },
      },
      include: {
        church: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return memberships;
  }

  async getAdminStats() {
    const [totalUsers, totalChurches, totalMembers, verifiedUsers] =
      await this.prisma.$transaction([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.church.count({ where: { deletedAt: null } }),
        this.prisma.churchMember.count(),
        this.prisma.user.count({
          where: { deletedAt: null, emailVerified: true },
        }),
      ]);

    return { totalUsers, totalChurches, totalMembers, verifiedUsers };
  }

  async getActivity(userId: string, limit: number = 50) {
    const activities = await this.prisma.auditLog.findMany({
      where: { userId },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return activities;
  }
}
