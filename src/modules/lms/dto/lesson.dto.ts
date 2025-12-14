/**
 * Lesson DTOs for LMS Module
 */
import { IsString, IsOptional, IsEnum, IsNumber, IsBoolean, IsUUID, Min } from 'class-validator';

export enum LessonType {
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
  QUIZ = 'QUIZ',
  ASSIGNMENT = 'ASSIGNMENT',
}

export class CreateLessonDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  orderIndex?: number;

  @IsOptional()
  @IsEnum(LessonType)
  type?: LessonType;

  @IsOptional()
  @IsUUID()
  videoAssetId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isPreview?: boolean;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}

export class UpdateLessonDto extends CreateLessonDto {}

export class ReorderLessonsDto {
  @IsUUID('4', { each: true })
  lessonIds: string[];
}

export class CreateVideoAssetDto {
  @IsOptional()
  @IsEnum(['UPLOAD', 'HLS', 'YOUTUBE', 'VIMEO'])
  provider?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  playbackId?: string;

  @IsOptional()
  @IsString()
  filePath?: string;

  @IsOptional()
  @IsNumber()
  durationSeconds?: number;

  @IsOptional()
  @IsBoolean()
  isProtected?: boolean;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

export class UpdateProgressDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  videoWatchedSeconds?: number;

  @IsOptional()
  @IsBoolean()
  lessonCompleted?: boolean;
}
