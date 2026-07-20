import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'Random post',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    example: 'content of post',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  content: string;
}
