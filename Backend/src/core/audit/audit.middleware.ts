import { Injectable } from '@nestjs/common';
import { AuditAction } from '@prisma/client';
import { AuditService } from './audit.service';

/**
 * Prisma 7 Query Extension for automatic audit logging of entity changes
 * This extension tracks CREATE, UPDATE, and DELETE operations on all models
 * using the $extends() API instead of the deprecated $use() middleware
 */
@Injectable()
export class AuditMiddleware {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Initialize the Prisma query extension
   * This should be called during PrismaService initialization
   * Returns the extended Prisma client
   */
  initializeExtension(prisma: any) {
    return prisma.$extends({
      query: {
        $allModels: {
          async create({ model, args, query }) {
            const result = await query(args);

            // Skip audit logs to avoid recursion
            if (model === 'AuditLog') {
              return result;
            }

            // Queue audit log asynchronously (don't await to avoid blocking the request)
            setImmediate(() => {
              this.auditService
                .log({
                  action: AuditAction.CREATE,
                  resource: model,
                  resourceId: this.extractResourceId(result),
                  changes: this.extractFieldChanges(args.data),
                  metadata: {
                    operation: 'create',
                    args: this.sanitizeArgs(args),
                  },
                })
                .catch(() => {
                  // Silently fail - logging shouldn't break the app
                });
            });

            return result;
          },

          async update({ model, args, query }) {
            const result = await query(args);

            // Skip audit logs to avoid recursion
            if (model === 'AuditLog') {
              return result;
            }

            // Queue audit log asynchronously
            setImmediate(() => {
              this.auditService
                .log({
                  action: AuditAction.UPDATE,
                  resource: model,
                  resourceId: this.extractResourceId(result),
                  changes: this.extractFieldChanges(args.data),
                  metadata: {
                    operation: 'update',
                    args: this.sanitizeArgs(args),
                  },
                })
                .catch(() => {
                  // Silently fail - logging shouldn't break the app
                });
            });

            return result;
          },

          async delete({ model, args, query }) {
            const result = await query(args);

            // Skip audit logs to avoid recursion
            if (model === 'AuditLog') {
              return result;
            }

            // Queue audit log asynchronously
            setImmediate(() => {
              this.auditService
                .log({
                  action: AuditAction.DELETE,
                  resource: model,
                  resourceId: this.extractResourceId(result),
                  changes: { deleted: true },
                  metadata: {
                    operation: 'delete',
                    args: this.sanitizeArgs(args),
                  },
                })
                .catch(() => {
                  // Silently fail - logging shouldn't break the app
                });
            });

            return result;
          },

          async deleteMany({ model, args, query }) {
            const result = await query(args);

            // Skip audit logs to avoid recursion
            if (model === 'AuditLog') {
              return result;
            }

            // Queue audit log asynchronously
            setImmediate(() => {
              this.auditService
                .log({
                  action: AuditAction.DELETE,
                  resource: model,
                  changes: { deleted: true, count: result.count },
                  metadata: {
                    operation: 'deleteMany',
                    args: this.sanitizeArgs(args),
                  },
                })
                .catch(() => {
                  // Silently fail - logging shouldn't break the app
                });
            });

            return result;
          },
        },
      },
    });
  }

  /**
   * Extract resource ID from result
   */
  private extractResourceId(result: any): string | undefined {
    if (result?.id) return result.id;
    if (result?.uuid) return result.uuid;
    return undefined;
  }

  /**
   * Extract field changes from data object
   */
  private extractFieldChanges(data: any): Record<string, any> {
    if (!data) return {};

    const changes: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value !== 'object' || value === null) {
        changes[key] = value;
      }
    }
    return changes;
  }

  /**
   * Sanitize sensitive arguments before logging
   */
  private sanitizeArgs(args: any): Record<string, any> {
    if (!args) return {};

    const sanitized = { ...args };
    const sensitiveFields = [
      'password',
      'passwordHash',
      'token',
      'refreshToken',
      'apiKey',
      'secret',
    ];

    const sanitizeObject = (obj: any) => {
      for (const key of Object.keys(obj)) {
        if (
          sensitiveFields.some((field) =>
            key.toLowerCase().includes(field.toLowerCase()),
          )
        ) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      }
    };

    sanitizeObject(sanitized);
    return sanitized;
  }
}
