import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ChurchId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.churchId;
  },
);

export const CurrentChurch = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.church;
  },
);
