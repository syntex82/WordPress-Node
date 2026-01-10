/**
 * Translation DTOs
 */

import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';

// ==================== UI TRANSLATIONS ====================

export class SetUITranslationDto {
  /** Translation namespace (e.g., 'admin') */
  @IsString()
  @MinLength(1)
  namespace: string;

  /** Translation key (e.g., 'buttons.save') */
  @IsString()
  @MinLength(1)
  key: string;

  /** Translation value (e.g., 'Save') */
  @IsString()
  value: string;
}

export class UITranslationItem {
  /** Translation namespace */
  @IsString()
  namespace: string;

  /** Translation key */
  @IsString()
  key: string;

  /** Translation value */
  @IsString()
  value: string;
}

export class BulkUITranslationsDto {
  /** Array of translations to set */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UITranslationItem)
  translations: UITranslationItem[];
}

// ==================== CONTENT TRANSLATIONS ====================

export class PostTranslationDto {
  /** Translated title */
  @IsString()
  @MinLength(1)
  title: string;

  /** Translated slug */
  @IsString()
  @MinLength(1)
  slug: string;

  /** Translated content */
  @IsString()
  content: string;

  /** Translated excerpt */
  @IsOptional()
  @IsString()
  excerpt?: string;

  /** Meta title for SEO */
  @IsOptional()
  @IsString()
  metaTitle?: string;

  /** Meta description for SEO */
  @IsOptional()
  @IsString()
  metaDescription?: string;

  /** Is translation published */
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class PageTranslationDto {
  /** Translated title */
  @IsString()
  @MinLength(1)
  title: string;

  /** Translated slug */
  @IsString()
  @MinLength(1)
  slug: string;

  /** Translated content */
  @IsString()
  content: string;

  /** Meta title for SEO */
  @IsOptional()
  @IsString()
  metaTitle?: string;

  /** Meta description for SEO */
  @IsOptional()
  @IsString()
  metaDescription?: string;

  /** Is translation published */
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class ProductTranslationDto {
  /** Translated name */
  @IsString()
  @MinLength(1)
  name: string;

  /** Translated slug */
  @IsString()
  @MinLength(1)
  slug: string;

  /** Translated description */
  @IsOptional()
  @IsString()
  description?: string;

  /** Translated short description */
  @IsOptional()
  @IsString()
  shortDescription?: string;

  /** Meta title for SEO */
  @IsOptional()
  @IsString()
  metaTitle?: string;

  /** Meta description for SEO */
  @IsOptional()
  @IsString()
  metaDescription?: string;

  /** Is translation published */
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class CourseTranslationDto {
  /** Translated title */
  @IsString()
  @MinLength(1)
  title: string;

  /** Translated slug */
  @IsString()
  @MinLength(1)
  slug: string;

  /** Translated description */
  @IsOptional()
  @IsString()
  description?: string;

  /** Translated short description */
  @IsOptional()
  @IsString()
  shortDescription?: string;

  /** What you will learn (translated) */
  @IsOptional()
  whatYouLearn?: any;

  /** Requirements (translated) */
  @IsOptional()
  requirements?: any;

  /** Is translation published */
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

