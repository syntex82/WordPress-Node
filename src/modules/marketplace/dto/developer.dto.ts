/**
 * Developer DTOs
 * Data transfer objects for developer profiles
 */

import { IsString, IsEnum, IsNumber, IsOptional, IsArray, Min, Max, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';

export enum DeveloperStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  REJECTED = 'REJECTED',
}

export enum DeveloperCategory {
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
  FULLSTACK = 'FULLSTACK',
  CMS = 'CMS',
  MOBILE = 'MOBILE',
  DEVOPS = 'DEVOPS',
  DESIGN = 'DESIGN',
  DATABASE = 'DATABASE',
  SECURITY = 'SECURITY',
  OTHER = 'OTHER',
}

export class CreateDeveloperDto {
  @IsString()
  displayName: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsEnum(DeveloperCategory)
  @IsOptional()
  category?: DeveloperCategory;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  frameworks?: string[];

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  hourlyRate: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minimumBudget?: number;

  @IsNumber()
  @Min(0)
  @Max(50)
  @IsOptional()
  @Type(() => Number)
  yearsOfExperience?: number;

  @IsString()
  @IsOptional()
  applicationNote?: string;

  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsUrl()
  @IsOptional()
  githubUrl?: string;

  @IsUrl()
  @IsOptional()
  linkedinUrl?: string;
}

export class UpdateDeveloperDto {
  @IsString()
  @IsOptional()
  displayName?: string;

  @IsString()
  @IsOptional()
  headline?: string;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsString()
  @IsOptional()
  profileImage?: string;

  @IsEnum(DeveloperCategory)
  @IsOptional()
  category?: DeveloperCategory;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  frameworks?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tools?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  spokenLanguages?: string[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  hourlyRate?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minimumBudget?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  yearsOfExperience?: number;

  @IsOptional()
  portfolio?: any[];

  @IsOptional()
  education?: any[];

  @IsOptional()
  certifications?: any[];

  @IsString()
  @IsOptional()
  availability?: string;

  @IsNumber()
  @Min(0)
  @Max(168)
  @IsOptional()
  @Type(() => Number)
  availableHours?: number;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsUrl()
  @IsOptional()
  websiteUrl?: string;

  @IsUrl()
  @IsOptional()
  githubUrl?: string;

  @IsUrl()
  @IsOptional()
  linkedinUrl?: string;
}

/**
 * Admin Update Developer DTO
 * Extended DTO for admin updates with additional fields
 */
import { IsBoolean } from 'class-validator';

export class AdminUpdateDeveloperDto extends UpdateDeveloperDto {
  @IsEnum(DeveloperStatus)
  @IsOptional()
  status?: DeveloperStatus;

  @IsBoolean()
  @IsOptional()
  isVerified?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  @Type(() => Number)
  rating?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  reviewCount?: number;
}
