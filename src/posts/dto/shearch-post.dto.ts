import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ShearchPostDto {
  @ApiPropertyOptional({
    example: 'shearch input',
    description: 'Keywork title post to shearch',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  q?: string;

  @ApiPropertyOptional({
    enum: ['createAt', 'title'],
    example: 'createAt',
    description: 'Use to sort post',
  })
  @IsOptional()
  @IsIn(['createAt', 'title'])
  sortBy?: 'createAt' | 'title';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    example: 'desc',
    description: 'Sort ',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
