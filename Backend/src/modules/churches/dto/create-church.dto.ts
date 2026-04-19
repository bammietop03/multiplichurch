import {
  IsString,
  IsNotEmpty,
  IsOptional,
  Matches,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChurchDto {
  @ApiProperty({ example: 'Grace Chapel' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'grace-chapel' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens only',
  })
  @MinLength(2)
  @MaxLength(50)
  slug: string;

  @ApiPropertyOptional({ example: 'A welcoming community church' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
