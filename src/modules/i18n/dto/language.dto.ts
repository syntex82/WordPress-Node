/**
 * Language DTOs
 */

import { IsString, IsBoolean, IsOptional, IsInt, MinLength, MaxLength, Matches } from 'class-validator';

export class CreateLanguageDto {
  /** ISO 639-1 language code (e.g., 'en', 'es-ES') */
  @IsString()
  @MinLength(2)
  @MaxLength(5)
  @Matches(/^[a-z]{2}(-[A-Z]{2})?$/, { message: 'Invalid language code format' })
  code: string;

  /** Display name (e.g., 'English') */
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  /** Native name (e.g., 'English') */
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nativeName: string;

  /** Is right-to-left language */
  @IsOptional()
  @IsBoolean()
  isRTL?: boolean;

  /** Flag emoji (e.g., '🇬🇧') */
  @IsOptional()
  @IsString()
  flagEmoji?: string;

  /** Full locale code (e.g., 'en-GB') */
  @IsOptional()
  @IsString()
  locale?: string;

  /** Date format preference (e.g., 'DD/MM/YYYY') */
  @IsOptional()
  @IsString()
  dateFormat?: string;

  /** Number format preference (e.g., '1,234.56') */
  @IsOptional()
  @IsString()
  numberFormat?: string;
}

export class UpdateLanguageDto {
  /** Display name */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  /** Native name */
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nativeName?: string;

  /** Is language active */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  /** Is default language */
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  /** Is right-to-left language */
  @IsOptional()
  @IsBoolean()
  isRTL?: boolean;

  /** Flag emoji */
  @IsOptional()
  @IsString()
  flagEmoji?: string;

  /** Full locale code */
  @IsOptional()
  @IsString()
  locale?: string;

  /** Date format preference */
  @IsOptional()
  @IsString()
  dateFormat?: string;

  /** Number format preference */
  @IsOptional()
  @IsString()
  numberFormat?: string;

  /** Sort order */
  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

