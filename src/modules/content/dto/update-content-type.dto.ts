/**
 * Update Content Type DTO
 */

import { IsString, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class UpdateContentTypeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @IsOptional()
  fields?: any[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
