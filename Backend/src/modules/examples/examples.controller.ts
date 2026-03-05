import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { OrganizationId } from '../../common/decorators/organization.decorator';
import { CurrentUser } from '../../common/decorators';

/**
 * EXAMPLE CONTROLLER SHOWING BOTH AUTHORIZATION MODES
 *
 * This demonstrates how the same application can use:
 * 1. Simple mode (direct user roles) for global features
 * 2. Multi-tenant mode (organization roles) for workspace features
 */
@ApiTags('Examples')
@ApiBearerAuth()
@Controller('examples')
@UseGuards(JwtAuthGuard)
export class ExamplesController {
  // ====================================
  // SIMPLE MODE EXAMPLES (No Organization Context)
  // ====================================

  /**
   * Global admin feature - checks direct user roles
   * Works without any organization context
   */
  @Get('admin/system-stats')
  @UseGuards(RolesGuard)
  @Roles('Super Admin', 'Admin')
  @ApiOperation({ summary: 'Get system statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'System statistics retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  getSystemStats(@CurrentUser() user: any) {
    return {
      message: 'System statistics',
      userId: user.id,
      note: 'This checks your DIRECT user roles (Simple Mode)',
    };
  }

  /**
   * Permission-based check without organization
   * Useful for global resource management
   */
  @Post('admin/users')
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: 'CREATE', resource: 'USER' })
  @ApiOperation({ summary: 'Create a user (Global permission)' })
  @ApiBody({
    schema: { type: 'object', properties: { name: { type: 'string' } } },
  })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  createUser(@Body() dto: any) {
    return {
      message: 'User created',
      note: 'This checks if you have CREATE USER permission globally',
    };
  }

  /**
   * Any authenticated user can access
   * No specific role required
   */
  @Get('profile')
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  getProfile(@CurrentUser() user: any) {
    return {
      userId: user.id,
      note: 'No authorization guard needed - just authentication',
    };
  }

  // ====================================
  // MULTI-TENANT MODE EXAMPLES (With Organization Context)
  // ====================================

  /**
   * Workspace feature - checks organization membership and role
   * Client must provide organization context via header/query/body
   *
   * Example request:
   * GET /examples/workspace/dashboard
   * Headers: {
   *   "Authorization": "Bearer <token>",
   *   "x-organization-id": "org_123"
   * }
   */
  @Get('workspace/dashboard')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('Owner', 'Admin', 'Member')
  @ApiOperation({ summary: 'Get workspace dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  getWorkspaceDashboard(
    @OrganizationId() orgId: string,
    @CurrentUser() user: any,
  ) {
    return {
      message: 'Workspace dashboard',
      organizationId: orgId,
      userId: user.id,
      userRole: user.membership?.roleDetails?.name,
      note: 'This checks your role WITHIN this specific organization',
    };
  }

  /**
   * Workspace admin feature - only owners and admins
   */
  @Post('workspace/settings')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('Owner', 'Admin')
  @ApiOperation({ summary: 'Update workspace settings' })
  @ApiBody({
    schema: { type: 'object', properties: { setting: { type: 'string' } } },
  })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Only Owner or Admin can update settings',
  })
  updateWorkspaceSettings(@OrganizationId() orgId: string, @Body() dto: any) {
    return {
      message: 'Settings updated',
      organizationId: orgId,
      note: 'Only Owner or Admin of THIS organization can do this',
    };
  }

  /**
   * Permission-based workspace action
   */
  @Post('workspace/projects')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: 'CREATE', resource: 'ORGANIZATION' })
  @ApiOperation({ summary: 'Create a project in workspace' })
  @ApiBody({
    schema: { type: 'object', properties: { name: { type: 'string' } } },
  })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  createProject(@OrganizationId() orgId: string, @Body() dto: any) {
    return {
      message: 'Project created',
      organizationId: orgId,
      note: 'Checks if your role in THIS org has CREATE ORGANIZATION permission',
    };
  }

  // ====================================
  // HYBRID EXAMPLE - Context Detection
  // ====================================

  /**
   * This endpoint works in BOTH modes!
   * - If organization context provided → checks org role
   * - If no organization context → checks direct user role
   */
  @Get('reports')
  @UseInterceptors(TenantInterceptor) // Optional context extraction
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Owner')
  @ApiOperation({ summary: 'Get reports (Simple or Multi-tenant mode)' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  getReports(
    @OrganizationId() orgId: string | undefined,
    @CurrentUser() user: any,
  ) {
    if (orgId) {
      return {
        message: 'Organization reports',
        organizationId: orgId,
        mode: 'Multi-Tenant',
        note: 'Checked your role within organization',
      };
    } else {
      return {
        message: 'Global reports',
        mode: 'Simple',
        note: 'Checked your direct user role',
      };
    }
  }
}
