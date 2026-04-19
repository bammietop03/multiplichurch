import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditLogPayload {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  userId?: string;
  churchId?: string;
  changes?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(forwardRef(() => PrismaService))
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Log an audit event
   */
  async log(payload: AuditLogPayload): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: payload.action,
          resource: payload.resource,
          resourceId: payload.resourceId,
          userId: payload.userId,
          churchId: payload.churchId,
          changes: payload.changes
            ? JSON.parse(JSON.stringify(payload.changes))
            : null,
          metadata: payload.metadata
            ? JSON.parse(JSON.stringify(payload.metadata))
            : null,
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log audit event', error);
      // Don't throw - logging failures should not break the application
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getLogs(
    filters: {
      action?: AuditAction;
      resource?: string;
      userId?: string;
      churchId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    pagination: { skip: number; take: number },
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        action: filters.action,
        resource: filters.resource,
        userId: filters.userId,
        churchId: filters.churchId,
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        church: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  /**
   * Get audit logs count
   */
  async getLogsCount(filters: {
    action?: AuditAction;
    resource?: string;
    userId?: string;
    churchId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<number> {
    return this.prisma.auditLog.count({
      where: {
        action: filters.action,
        resource: filters.resource,
        userId: filters.userId,
        churchId: filters.churchId,
        createdAt: {
          gte: filters.startDate,
          lte: filters.endDate,
        },
      },
    });
  }
}
