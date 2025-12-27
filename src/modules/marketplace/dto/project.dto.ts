/**
 * Project DTOs
 */

import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDateString,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class CreateProjectDto {
  @IsUUID()
  developerId: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsString()
  @IsOptional()
  budgetType?: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  totalBudget: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  hourlyRate?: number;

  @IsDateString()
  @IsOptional()
  deadline?: string;

  @IsOptional()
  milestones?: any[];
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  progress?: number;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsOptional()
  milestones?: any[];

  @IsOptional()
  deliverables?: any[];
}

export class LogHoursDto {
  @IsNumber()
  @Min(0.25)
  @Type(() => Number)
  hours: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateProjectReviewDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating: number;

  @IsString()
  @IsOptional()
  review?: string;
}

export class ProjectFiltersDto {
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsUUID()
  @IsOptional()
  developerId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
