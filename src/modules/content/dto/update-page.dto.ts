/**
 * Update Page DTO
 */

import { IsString, IsEnum, IsOptional, IsObject } from 'class-validator';
import { PostStatus } from '@prisma/client';

export class UpdatePageDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  template?: string;

  @IsString()
  @IsOptional()
  featuredImage?: string;

  @IsEnum(PostStatus)
  @IsOptional()
  status?: PostStatus;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsObject()
  @IsOptional()
  customFields?: any;
}
