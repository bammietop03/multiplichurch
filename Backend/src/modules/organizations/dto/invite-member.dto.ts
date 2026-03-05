import { IsEmail, IsString, IsNotEmpty, IsIn } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['Owner', 'Admin', 'Member'])
  role: string;
}
