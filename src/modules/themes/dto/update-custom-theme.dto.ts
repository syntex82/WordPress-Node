/**
 * Update Custom Theme DTO
 * Validates input for updating an existing custom theme
 */

import {
  IsString,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class ContentBlockDataDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsObject()
  @IsOptional()
  props?: Record<string, any>;

  @IsObject()
  @IsOptional()
  link?: { url?: string; target?: string; enabled?: boolean };

  @IsObject()
  @IsOptional()
  visibility?: { desktop?: boolean; tablet?: boolean; mobile?: boolean };

  @IsObject()
  @IsOptional()
  animation?: { type?: string; duration?: number; delay?: number };
}

class ThemePageDataDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentBlockDataDto)
  @IsOptional()
  blocks?: ContentBlockDataDto[];

  @IsBoolean()
  @IsOptional()
  isHomePage?: boolean;
}

export class UpdateCustomThemeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsOptional()
  settings?: Record<string, any>;

  @IsString()
  @IsOptional()
  customCSS?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ThemePageDataDto)
  @IsOptional()
  pages?: ThemePageDataDto[];

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}

