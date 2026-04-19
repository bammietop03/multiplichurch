import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto, UpdatePasswordDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailVerifiedGuard } from '../../common/guards';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, EmailVerifiedGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Update user password' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or incorrect password',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  updatePassword(
    @CurrentUser() user: any,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.usersService.updatePassword(user.id, updatePasswordDto);
  }

  @Patch('me/deactivate')
  @ApiOperation({ summary: 'Deactivate user account' })
  @ApiResponse({ status: 200, description: 'Account deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  deactivateAccount(@CurrentUser() user: any) {
    return this.usersService.deactivateAccount(user.id);
  }

  @Get('me/export')
  @ApiOperation({ summary: 'Export user data' })
  @ApiResponse({ status: 200, description: 'User data exported successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  exportData(@CurrentUser() user: any) {
    return this.usersService.exportData(user.id);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  deleteAccount(@CurrentUser() user: any) {
    return this.usersService.deleteAccount(user.id);
  }

  @Get('me/churches')
  @ApiOperation({ summary: 'Get user churches' })
  @ApiResponse({
    status: 200,
    description: 'Churches retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getChurches(@CurrentUser() user: any) {
    return this.usersService.getChurches(user.id);
  }

  @Get('admin/stats')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get admin stats' })
  @ApiResponse({
    status: 200,
    description: 'Admin stats retrieved successfully',
  })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  getAdminStats() {
    return this.usersService.getAdminStats();
  }

  @Get('me/activity')
  @ApiOperation({ summary: 'Get user activity log' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Limit results',
  })
  @ApiResponse({
    status: 200,
    description: 'Activity log retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getActivity(
    @CurrentUser() user: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.usersService.getActivity(user.id, limit);
  }
}
