import { IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { GroupVisibility } from '@prisma/client';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(GroupVisibility)
  visibility?: GroupVisibility;
}

