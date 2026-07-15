import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'admin',
    description: 'Unique public username',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'user2@example.test',
    description: 'Unique email used for login and password recovery',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    minLength: 6,
    description: 'Password must be least 6 characters',
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'Admin',
    description: 'Display name user',
  })
  @IsOptional()
  @IsString()
  name?: string;
}
