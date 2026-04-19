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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ChurchesService } from './churches.service';
import {
  CreateChurchDto,
  UpdateChurchDto,
  InviteMemberDto,
  UpdateMemberRoleDto,
  DirectAddMemberDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../../common/guards';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantInterceptor } from '../../common/interceptors/tenant.interceptor';
import {
  Roles,
  SkipChurchCheck,
} from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Churches')
@ApiBearerAuth()
@Controller('churches')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class ChurchesController {
  constructor(private readonly churchesService: ChurchesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new church' })
  @ApiBody({ type: CreateChurchDto })
  @ApiResponse({ status: 201, description: 'Church created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@CurrentUser() user: any, @Body() createChurchDto: CreateChurchDto) {
    return this.churchesService.create(user.id, createChurchDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all churches for current user' })
  @ApiResponse({ status: 200, description: 'Churches retrieved successfully' })
  findAll(@CurrentUser() user: any) {
    return this.churchesService.findAll(user.id);
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get all churches (admin)' })
  @ApiResponse({ status: 200, description: 'All churches retrieved' })
  findAllAdmin(@Query('search') search?: string) {
    return this.churchesService.findAllAdmin(search);
  }

  @Get(':id')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Get a specific church by ID' })
  @ApiParam({ name: 'id', description: 'Church ID' })
  @ApiResponse({ status: 200, description: 'Church retrieved successfully' })
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.churchesService.findOne(id, user.id);
  }

  @Patch(':id')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update a church' })
  @ApiParam({ name: 'id', description: 'Church ID' })
  @ApiBody({ type: UpdateChurchDto })
  @ApiResponse({ status: 200, description: 'Church updated successfully' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() updateChurchDto: UpdateChurchDto,
  ) {
    return this.churchesService.update(id, user.id, updateChurchDto);
  }

  @Patch(':id/logo')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update church logo' })
  @ApiParam({ name: 'id', description: 'Church ID' })
  @ApiBody({
    schema: { type: 'object', properties: { logo: { type: 'string' } } },
  })
  @ApiResponse({ status: 200, description: 'Church logo updated successfully' })
  updateLogo(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body('logo') logo: string,
  ) {
    return this.churchesService.updateLogo(id, user.id, logo);
  }

  @Delete(':id')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a church' })
  @ApiParam({ name: 'id', description: 'Church ID' })
  @ApiResponse({ status: 200, description: 'Church deleted successfully' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.churchesService.remove(id, user.id);
  }

  @Get(':id/members')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Get members of a church' })
  @ApiParam({ name: 'id', description: 'Church ID' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully' })
  getMembers(@Param('id') id: string, @CurrentUser() user: any) {
    return this.churchesService.getMembers(id, user.id);
  }

  @Get(':id/members/admin')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @SkipChurchCheck()
  @ApiOperation({ summary: 'Get all members of a church (admin)' })
  @ApiParam({ name: 'id', description: 'Church ID' })
  getMembersAdmin(@Param('id') id: string) {
    return this.churchesService.getMembersAdmin(id);
  }

  @Post(':id/invites')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Send an invite to join a church' })
  @ApiParam({ name: 'id', description: 'Church ID' })
  @ApiBody({ type: InviteMemberDto })
  @ApiResponse({ status: 201, description: 'Invite sent successfully' })
  sendInvite(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() inviteMemberDto: InviteMemberDto,
  ) {
    return this.churchesService.sendInvite(id, user.id, inviteMemberDto);
  }

  @Post(':id/members/direct')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Directly add a member, creating an account if needed',
  })
  @ApiParam({ name: 'id', description: 'Church ID' })
  @ApiBody({ type: DirectAddMemberDto })
  @ApiResponse({
    status: 201,
    description: 'Member added and welcome email sent',
  })
  directAddMember(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: DirectAddMemberDto,
  ) {
    return this.churchesService.directAddMember(id, user.id, dto);
  }

  @Delete(':id/members/:memberId')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove a member from a church' })
  @ApiParam({ name: 'id', description: 'Church ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiResponse({ status: 200, description: 'Member removed successfully' })
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.churchesService.removeMember(id, memberId, user.id);
  }

  @Patch(':id/members/:memberId')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update member role in a church' })
  @ApiParam({ name: 'id', description: 'Church ID' })
  @ApiParam({ name: 'memberId', description: 'Member ID' })
  @ApiBody({ type: UpdateMemberRoleDto })
  @ApiResponse({ status: 200, description: 'Member role updated successfully' })
  updateMemberRole(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
    @Body() updateMemberRoleDto: UpdateMemberRoleDto,
  ) {
    return this.churchesService.updateMemberRole(
      id,
      memberId,
      user.id,
      updateMemberRoleDto,
    );
  }

  @Post(':id/leave')
  @UseInterceptors(TenantInterceptor)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MEMBER')
  @ApiOperation({ summary: 'Leave a church' })
  @ApiParam({ name: 'id', description: 'Church ID' })
  @ApiResponse({ status: 200, description: 'Left church successfully' })
  leaveChurch(@Param('id') id: string, @CurrentUser() user: any) {
    return this.churchesService.leaveChurch(id, user.id);
  }
}
