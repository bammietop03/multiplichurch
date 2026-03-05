import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../../common/guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import { Roles } from '../../common/decorators/roles.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @RequirePermissions({ action: 'CREATE', resource: 'ORGANIZATION' })
  @ApiOperation({ summary: 'Create a new organization' })
  @ApiBody({ type: CreateOrganizationDto })
  @ApiResponse({
    status: 201,
    description: 'Organization created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  create(
    @CurrentUser() user: any,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ) {
    return this.organizationsService.create(user.id, createOrganizationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all organizations for current user' })
  @ApiResponse({
    status: 200,
    description: 'Organizations retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: any) {
    return this.organizationsService.findAll(user.id);
  }

  @Get(':id')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('Owner', 'Admin', 'Member')
  @ApiOperation({ summary: 'Get a specific organization by ID' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Organization retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.organizationsService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(PermissionsGuard)
  @RequirePermissions({ action: 'UPDATE', resource: 'ORGANIZATION' })
  @ApiOperation({ summary: 'Update an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiBody({ type: UpdateOrganizationDto })
  @ApiResponse({
    status: 200,
    description: 'Organization updated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, user.id, updateOrganizationDto);
  }

  @Delete(':id')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('Owner')
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({
    status: 200,
    description: 'Organization deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Only organization owner can delete',
  })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.organizationsService.remove(id, user.id);
  }

  @Post(':id/members')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('Owner', 'Admin')
  @ApiOperation({ summary: 'Invite a member to organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiBody({ type: InviteMemberDto })
  @ApiResponse({ status: 201, description: 'Member invited successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.organizationsService.inviteMember(id, user.id, inviteMemberDto);
  }

  @Delete(':id/members/:memberId')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('Owner', 'Admin')
  @ApiOperation({ summary: 'Remove a member from organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Member or organization not found' })
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.organizationsService.removeMember(id, memberId, user.id);
  }

  @Patch(':id/members/:memberId')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('Owner', 'Admin')
  @ApiOperation({ summary: 'Update member role in organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiResponse({ status: 200, description: 'Member role updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Member or organization not found' })
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.organizationsService.updateMemberRole(
      id,
      memberId,
      user.id,
      updateMemberRoleDto,
    );
  }

  @Post(':id/leave')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('Owner', 'Admin', 'Member')
  @ApiOperation({ summary: 'Leave an organization' })
  @ApiParam({ name: 'id', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Left organization successfully' })
  @ApiResponse({ status: 403, description: 'Cannot leave organization' })
  @ApiResponse({ status: 404, description: 'Organization not found' })
  leaveOrganization(@Param('id') id: string, @CurrentUser() user: any) {
    return this.organizationsService.leavOrganization(id, user.id);
  }
}
