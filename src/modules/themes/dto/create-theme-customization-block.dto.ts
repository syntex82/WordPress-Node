import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class CreateThemeCustomizationBlockDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  type: string; // 'hero', 'features', 'testimonials', 'cta', 'gallery', 'text', 'custom'

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  richContent?: Record<string, any>;

  @IsString()
  @IsOptional()
  backgroundColor?: string;

  @IsString()
  @IsOptional()
  textColor?: string;

  @IsString()
  @IsOptional()
  customCSS?: string;

  @IsString()
  @IsOptional()
  layout?: string;

  @IsNumber()
  @IsOptional()
  columns?: number;

  @IsString()
  @IsOptional()
  padding?: string;

  @IsString()
  @IsOptional()
  margin?: string;

  @IsString()
  @IsOptional()
  backgroundImage?: string;

  @IsString()
  @IsOptional()
  featuredImage?: string;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsOptional()
  customData?: Record<string, any>;
}

export class UpdateThemeCustomizationBlockDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsOptional()
  richContent?: Record<string, any>;

  @IsString()
  @IsOptional()
  backgroundColor?: string;

  @IsString()
  @IsOptional()
  textColor?: string;

  @IsString()
  @IsOptional()
  customCSS?: string;

  @IsString()
  @IsOptional()
  layout?: string;

  @IsNumber()
  @IsOptional()
  columns?: number;

  @IsString()
  @IsOptional()
  padding?: string;

  @IsString()
  @IsOptional()
  margin?: string;

  @IsString()
  @IsOptional()
  backgroundImage?: string;

  @IsString()
  @IsOptional()
  featuredImage?: string;

  @IsBoolean()
  @IsOptional()
  isVisible?: boolean;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsOptional()
  customData?: Record<string, any>;
}
