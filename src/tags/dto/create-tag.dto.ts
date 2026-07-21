import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({
    example: 'TagName',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;
}
