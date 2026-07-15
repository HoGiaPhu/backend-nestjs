import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: ' Your-pass ',
    description: 'your current password',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    example: 'new pass',
    minLength: 6,
    description: 'Your new password',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
