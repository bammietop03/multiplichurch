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
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        memberships: {
          select: {
            id: true,
            organizationId: true,
            role: true,
            organization: {
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
      organizations: user.memberships.map((m) => ({
        ...m.organization,
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
            organization: true,
            roleDetails: true,
          },
        },
        refreshTokens: {
          select: {
            createdAt: true,
            expiresAt: true,
          },
        },
        apiKeys: {
          select: {
            name: true,
            createdAt: true,
            lastUsedAt: true,
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

    // Remove from organizations
    await this.prisma.organizationMember.deleteMany({
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

  async getOrganizations(userId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        userId,
        organization: {
          deletedAt: null,
        },
      },
      include: {
        organization: true,
        roleDetails: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return memberships;
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
