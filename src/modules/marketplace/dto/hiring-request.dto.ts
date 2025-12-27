/**
 * Hiring Request DTOs
 */

import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum HiringRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISPUTED = 'DISPUTED',
}

export class CreateHiringRequestDto {
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
  budgetType?: string; // 'fixed' or 'hourly'

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  budgetAmount: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  estimatedHours?: number;

  @IsDateString()
  @IsOptional()
  deadline?: string;
}

export class UpdateHiringRequestStatusDto {
  @IsEnum(HiringRequestStatus)
  status: HiringRequestStatus;

  @IsString()
  @IsOptional()
  responseMessage?: string;
}

export class HiringRequestFiltersDto {
  @IsEnum(HiringRequestStatus)
  @IsOptional()
  status?: HiringRequestStatus;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
