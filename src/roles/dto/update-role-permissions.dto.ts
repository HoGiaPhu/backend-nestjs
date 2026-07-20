import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsIn } from 'class-validator';
import {
  Permission,
  PERMISSION_VALUES,
} from '../constants/permissions.constant';

export class UpdateRolePermissionDto {
  @ApiProperty({
    example: ['users.read', 'users.lock'],
  })
  @IsArray()
  @IsIn(PERMISSION_VALUES, { each: true })
  permissions: Permission[];
}
