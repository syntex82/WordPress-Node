/**
 * Certificate Template DTOs
 */
import { IsString, IsOptional, IsBoolean, IsInt, Min, Max, IsHexColor } from 'class-validator';

export class CreateCertificateTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  textColor?: string;

  @IsOptional()
  @IsString()
  accentColor?: string;

  @IsOptional()
  @IsString()
  titleFont?: string;

  @IsOptional()
  @IsString()
  bodyFont?: string;

  @IsOptional()
  @IsInt()
  @Min(20)
  @Max(72)
  titleFontSize?: number;

  @IsOptional()
  @IsInt()
  @Min(16)
  @Max(60)
  nameFontSize?: number;

  @IsOptional()
  @IsInt()
  @Min(14)
  @Max(48)
  courseFontSize?: number;

  @IsOptional()
  @IsInt()
  @Min(10)
  @Max(24)
  bodyFontSize?: number;

  @IsOptional()
  @IsString()
  titleText?: string;

  @IsOptional()
  @IsString()
  subtitleText?: string;

  @IsOptional()
  @IsString()
  completionText?: string;

  @IsOptional()
  @IsString()
  brandingText?: string;

  @IsOptional()
  @IsBoolean()
  showBorder?: boolean;

  @IsOptional()
  @IsBoolean()
  showLogo?: boolean;

  @IsOptional()
  @IsBoolean()
  showBranding?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  borderWidth?: number;

  @IsOptional()
  @IsString()
  borderStyle?: string;

  @IsOptional()
  @IsString()
  customCSS?: string;

  @IsOptional()
  metadata?: any;
}

export class UpdateCertificateTemplateDto extends CreateCertificateTemplateDto {}
