import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ChurchesService } from './churches.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';

@ApiTags('Invites')
@Controller('invites')
export class InvitesController {
  constructor(private readonly churchesService: ChurchesService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Preview an invite (public)' })
  @ApiParam({ name: 'token', description: 'Invite token' })
  @ApiResponse({ status: 200, description: 'Invite details' })
  @ApiResponse({ status: 404, description: 'Invite not found' })
  @ApiResponse({ status: 400, description: 'Invite expired or already used' })
  getInvite(@Param('token') token: string) {
    return this.churchesService.getInviteByToken(token);
  }

  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a church invite (requires authentication)' })
  @ApiParam({ name: 'token', description: 'Invite token' })
  @ApiResponse({ status: 200, description: 'Invite accepted successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired invite' })
  @ApiResponse({ status: 403, description: 'Invite email mismatch' })
  @ApiResponse({ status: 409, description: 'Already a member' })
  acceptInvite(@Param('token') token: string, @CurrentUser() user: any) {
    return this.churchesService.acceptInvite(token, user.id);
  }
}
