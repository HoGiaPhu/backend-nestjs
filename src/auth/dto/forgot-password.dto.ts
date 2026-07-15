import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@mail.com',
    description: 'Your email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
