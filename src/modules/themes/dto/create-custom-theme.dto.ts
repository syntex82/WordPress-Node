/**
 * Create Custom Theme DTO
 * Validates input for creating a new custom theme
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsArray,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

class ContentBlockDataDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsObject()
  @IsNotEmpty()
  props: Record<string, any>;

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
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentBlockDataDto)
  @IsNotEmpty()
  blocks: ContentBlockDataDto[];

  @IsBoolean()
  @IsOptional()
  isHomePage?: boolean;
}

export class CreateCustomThemeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsObject()
  @IsNotEmpty()
  settings: Record<string, any>;

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

