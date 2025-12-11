/**
 * Security DTOs
 * Data transfer objects for security endpoints
 */

import { IsString, IsNotEmpty, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { SecurityEventType } from '@prisma/client';

export class BlockIpDto {
  @IsString()
  @IsNotEmpty()
  ip: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}

export class UnblockIpDto {
  @IsString()
  @IsNotEmpty()
  ip: string;
}

export class Enable2FADto {
  @IsString()
  @IsNotEmpty()
  secret: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}

export class Verify2FADto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class Disable2FADto {
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SecurityEventFiltersDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsEnum(SecurityEventType)
  @IsOptional()
  type?: SecurityEventType;

  @IsString()
  @IsOptional()
  ip?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsOptional()
  limit?: number;

  @IsOptional()
  offset?: number;
}

