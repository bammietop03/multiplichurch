import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';

/**
 * Simple CSRF protection using Double Submit Cookie pattern
 * For production, consider using a more robust solution
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    // Only check CSRF for state-changing methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    const csrfTokenFromHeader =
      request.headers['x-csrf-token'] || request.headers['x-xsrf-token'];
    const csrfTokenFromCookie =
      request.cookies['csrf-token'] || request.cookies['XSRF-TOKEN'];

    if (!csrfTokenFromHeader || !csrfTokenFromCookie) {
      throw new ForbiddenException('CSRF token missing');
    }

    if (csrfTokenFromHeader !== csrfTokenFromCookie) {
      throw new ForbiddenException('CSRF token mismatch');
    }

    return true;
  }

  /**
   * Generate a CSRF token
   */
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
