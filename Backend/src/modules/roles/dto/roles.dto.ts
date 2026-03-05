import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUUID,
  IsEnum,
  MinLength,
  MaxLength,
} from 'class-validator';
import { PermissionAction, PermissionResource } from '@prisma/client';

// ============================================
// ROLE DTOs
// ============================================

export class CreateRoleDto {
  @ApiProperty({ description: 'Role name', example: 'Manager' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Manages team members and projects',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @ApiPropertyOptional({
    description: 'Permission IDs to assign to the role',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: 'Role name', example: 'Manager' })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    description: 'Role description',
    example: 'Manages team members and projects',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

export class AssignPermissionsDto {
  @ApiProperty({
    description: 'Permission IDs to assign to the role',
    type: [String],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  permissionIds: string[];
}

export class AssignRoleToUserDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Role ID' })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}

export class RemoveRoleFromUserDto {
  @ApiProperty({ description: 'User ID' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Role ID' })
  @IsUUID()
  @IsNotEmpty()
  roleId: string;
}

// ============================================
// PERMISSION DTOs
// ============================================

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Permission action',
    enum: PermissionAction,
    example: PermissionAction.CREATE,
  })
  @IsEnum(PermissionAction)
  @IsNotEmpty()
  action: PermissionAction;

  @ApiProperty({
    description: 'Permission resource',
    enum: PermissionResource,
    example: PermissionResource.USER,
  })
  @IsEnum(PermissionResource)
  @IsNotEmpty()
  resource: PermissionResource;

  @ApiPropertyOptional({
    description: 'Permission description',
    example: 'Can create new users',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

export class UpdatePermissionDto {
  @ApiPropertyOptional({
    description: 'Permission description',
    example: 'Can create new users',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

export class PermissionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: PermissionAction })
  action: PermissionAction;

  @ApiProperty({ enum: PermissionResource })
  resource: PermissionResource;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class RoleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  isSystem: boolean;

  @ApiProperty({ type: [PermissionResponseDto] })
  permissions: PermissionResponseDto[];

  @ApiProperty()
  usersCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class UserRoleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  roleId: string;

  @ApiProperty()
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };

  @ApiProperty()
  role: {
    id: string;
    name: string;
    description?: string;
  };

  @ApiProperty()
  createdAt: Date;
}

// ============================================
// QUERY DTOs
// ============================================

export class RolesQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Search by name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Include system roles', default: true })
  @IsBoolean()
  @IsOptional()
  includeSystem?: boolean;
}

export class PermissionsQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 50 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filter by action',
    enum: PermissionAction,
  })
  @IsEnum(PermissionAction)
  @IsOptional()
  action?: PermissionAction;

  @ApiPropertyOptional({
    description: 'Filter by resource',
    enum: PermissionResource,
  })
  @IsEnum(PermissionResource)
  @IsOptional()
  resource?: PermissionResource;
}

export class UserRolesQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Filter by role ID' })
  @IsUUID()
  @IsOptional()
  roleId?: string;

  @ApiPropertyOptional({ description: 'Search by user email or name' })
  @IsString()
  @IsOptional()
  search?: string;
}
