import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token for reset password',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    example: 'newpass123',
    minLength: 6,
    description: 'new password',
  })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
