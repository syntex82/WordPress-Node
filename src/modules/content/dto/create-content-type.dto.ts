/**
 * Create Content Type DTO
 */

import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean } from 'class-validator';

export class CreateContentTypeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsArray()
  @IsNotEmpty()
  fields: any[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}

