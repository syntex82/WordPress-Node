/**
 * DTOs for Reels Module
 */

import { IsString, IsUrl, IsOptional, IsNumber, IsBoolean, IsArray, Min, Max, MaxLength } from 'class-validator';

export class CreateReelDto {
  @IsUrl()
  videoUrl: string;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;

  @IsNumber()
  @Min(15)
  @Max(60)
  duration: number;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  audioName?: string;

  @IsOptional()
  @IsUrl()
  audioUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hashtags?: string[];
}

export class UpdateReelDto {
  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class CreateCommentDto {
  @IsString()
  @MaxLength(500)
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class TrackViewDto {
  @IsNumber()
  @Min(0)
  watchTime: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}

