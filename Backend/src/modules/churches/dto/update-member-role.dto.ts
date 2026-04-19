import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: ['ADMIN', 'MEMBER'], example: 'ADMIN' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['ADMIN', 'MEMBER'])
  role: string;
}
