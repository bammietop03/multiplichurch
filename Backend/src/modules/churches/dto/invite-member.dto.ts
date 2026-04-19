import { IsEmail, IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteMemberDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: ['ADMIN', 'MEMBER'], example: 'MEMBER' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ADMIN', 'MEMBER'])
  role: string;
}
