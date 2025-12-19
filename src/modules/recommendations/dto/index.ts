/**
 * Recommendations DTOs
 */
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsObject, Min, Max } from 'class-validator';

// ============================================
// Query DTOs
// ============================================

export class GetRecommendationsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 6;

  @IsOptional()
  @IsString()
  algorithm?: string; // 'related', 'trending', 'personalized', 'popular'

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class TrackInteractionDto {
  @IsString()
  contentType: string; // 'post', 'page', 'product', 'course'

  @IsString()
  contentId: string;

  @IsString()
  interactionType: string; // 'view', 'click', 'purchase', 'enroll', 'like', 'share', 'bookmark'

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class TrackRecommendationClickDto {
  @IsString()
  sourceType: string;

  @IsString()
  sourceId: string;

  @IsString()
  recommendationType: string;

  @IsString()
  clickedType: string;

  @IsString()
  clickedId: string;

  @IsOptional()
  @IsNumber()
  position?: number;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

// ============================================
// Admin DTOs
// ============================================

export class CreateRecommendationRuleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  sourceType: string; // 'post', 'page', 'product', 'course', 'category', 'tag', 'global'

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsString()
  targetType: string; // 'post', 'page', 'product', 'course'

  @IsString()
  algorithm: string; // 'related', 'trending', 'personalized', 'manual', 'popular', 'recent'

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateRecommendationRuleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  sourceType?: string;

  @IsOptional()
  @IsString()
  sourceId?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsString()
  algorithm?: string;

  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AddManualRecommendationDto {
  @IsString()
  contentType: string;

  @IsString()
  contentId: string;

  @IsOptional()
  @IsNumber()
  position?: number;
}

export class UpdateRecommendationSettingsDto {
  @IsOptional()
  @IsBoolean()
  enablePersonalized?: boolean;

  @IsOptional()
  @IsBoolean()
  enableTrending?: boolean;

  @IsOptional()
  @IsNumber()
  cacheDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  defaultLimit?: number;

  @IsOptional()
  @IsNumber()
  trendingTimeframeDays?: number;

  @IsOptional()
  @IsBoolean()
  trackAnonymousUsers?: boolean;
}

