import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ShearchPostDto {
  @ApiPropertyOptional({
    example: 'shearch input',
    description: 'Keywork title post to shearch',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;
}
