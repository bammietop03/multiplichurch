import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';

export interface StandardResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: {
    timestamp: string;
    path: string;
    method: string;
  };
}

// Decorator to exclude endpoints from standard response wrapping
export const SkipResponseTransform = () =>
  Reflect.metadata('skipResponseTransform', true);

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  StandardResponse<T>
> {
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<StandardResponse<T>> {
    const skipTransform = this.reflector.get<boolean>(
      'skipResponseTransform',
      context.getHandler(),
    );

    if (skipTransform) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { url, method } = request;

    return next.handle().pipe(
      map((data) => {
        // If response already has a success field, it's already formatted
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Extract message if it exists in the data
        let message: string | undefined;
        let responseData = data;

        if (data && typeof data === 'object' && 'message' in data) {
          message = data.message;
          // Remove message from data object to avoid duplication
          const { message: _, ...rest } = data;
          responseData = Object.keys(rest).length > 0 ? rest : undefined;
        }

        return {
          success: true,
          message,
          data: responseData,
          meta: {
            timestamp: new Date().toISOString(),
            path: url,
            method,
          },
        };
      }),
    );
  }
}
