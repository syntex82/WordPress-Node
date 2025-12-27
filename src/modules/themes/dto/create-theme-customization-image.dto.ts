import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class CreateThemeCustomizationImageDto {
  @IsString()
  @IsNotEmpty()
  name: string; // e.g., 'logo', 'hero-image'

  @IsString()
  @IsNotEmpty()
  type: string; // 'logo', 'hero', 'background', 'featured', 'banner', 'custom'

  @IsString()
  @IsNotEmpty()
  url: string; // Can be a URL or data URL (base64)

  @IsString()
  @IsOptional()
  altText?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  section?: string;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsOptional()
  customData?: Record<string, any>;
}

export class UpdateThemeCustomizationImageDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  url?: string; // Can be a URL or data URL (base64)

  @IsString()
  @IsOptional()
  altText?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  width?: number;

  @IsNumber()
  @IsOptional()
  height?: number;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @IsNumber()
  @IsOptional()
  fileSize?: number;

  @IsString()
  @IsOptional()
  section?: string;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsOptional()
  customData?: Record<string, any>;
}
