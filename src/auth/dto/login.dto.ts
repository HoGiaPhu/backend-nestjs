import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'user1@example.test',
    description: 'Email used for login',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: '123456',
    minLength: 6,
    description: 'Password account',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
