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

    // Get churchId from header, query, body, or route params (e.g. /churches/:id/*)
    const churchId =
      request.headers['x-church-id'] ||
      request.query.churchId ||
      request.body?.churchId ||
      request.params?.id;

    if (churchId) {
      // Validate that the church exists
      const church = await this.prisma.church.findUnique({
        where: { id: churchId },
      });

      if (!church) {
        throw new BadRequestException('Church not found');
      }

      // Attach churchId and church to request
      request.churchId = churchId;
      request.church = church;
    }

    return next.handle();
  }
}
