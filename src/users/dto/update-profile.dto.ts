import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Gender } from 'generated/prisma/enums';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Nguyen Van A',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    example: 'pham van chieu - go vap - ho chi minh',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({
    example: '00xxxxxxxxxxx',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{12}$/, {
    message: 'cccd must contain 12 digits',
  })
  cccd?: string;

  @ApiPropertyOptional({
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    example: '0123345678',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{10}$/, {
    message: 'phoneNumber must contain exactly 10 digits',
  })
  phoneNumber?: string;
}
