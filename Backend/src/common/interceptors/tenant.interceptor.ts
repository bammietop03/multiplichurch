import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../core/database/prisma.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();

    // Get organizationId from header, query, or body
    const organizationId =
      request.headers['x-organization-id'] ||
      request.query.organizationId ||
      request.body?.organizationId;

    if (organizationId) {
      // Validate that the organization exists
      const organization = await this.prisma.organization.findUnique({
        where: { id: organizationId },
      });

      if (!organization) {
        throw new BadRequestException('Organization not found');
      }

      // Attach organizationId and organization to request
      request.organizationId = organizationId;
      request.organization = organization;
    }

    return next.handle();
  }
}
