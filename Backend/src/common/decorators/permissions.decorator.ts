import { SetMetadata } from '@nestjs/common';

export interface Permission {
  action: string;
  resource: string;
}

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
