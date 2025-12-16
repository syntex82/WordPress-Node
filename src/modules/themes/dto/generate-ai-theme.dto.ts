/**
 * Generate AI Theme DTO
 * Validates input for AI-powered theme generation
 */

import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class GenerateAiThemeDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsOptional()
  themeName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(5)
  numberOfPages?: number;

  @IsString()
  @IsOptional()
  style?: 'modern' | 'minimal' | 'bold' | 'professional' | 'creative';

  @IsString()
  @IsOptional()
  colorScheme?: 'light' | 'dark' | 'auto';
}
