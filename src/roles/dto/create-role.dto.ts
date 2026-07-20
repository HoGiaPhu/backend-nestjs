import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  Permission,
  PERMISSION_VALUES,
} from '../constants/permissions.constant';

export class CreateRoleDto {
  @ApiProperty()
  @IsString()
  @MaxLength(30)
  name: string;

  @ApiPropertyOptional({
    example: 'manage posts and comments',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  description?: string;

  @ApiProperty({
    example: ['users.read', 'users.lock'],
  })
  @IsArray()
  @IsIn(PERMISSION_VALUES, { each: true })
  permissions: Permission[];
}
