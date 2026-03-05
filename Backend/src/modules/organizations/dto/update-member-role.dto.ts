import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['Owner', 'Admin', 'Member'])
  role: string;
}
