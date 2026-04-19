import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const SKIP_CHURCH_CHECK_KEY = 'skipChurchCheck';
export const SkipChurchCheck = () => SetMetadata(SKIP_CHURCH_CHECK_KEY, true);
