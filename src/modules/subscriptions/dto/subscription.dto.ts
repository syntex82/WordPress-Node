import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  monthlyPrice: number;

  @IsOptional()
  @IsNumber()
  yearlyPrice?: number;

  @IsOptional()
  @IsString()
  stripePriceIdMonthly?: string;

  @IsOptional()
  @IsString()
  stripePriceIdYearly?: string;

  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @IsOptional()
  @IsNumber()
  maxStorageMb?: number;

  @IsOptional()
  @IsNumber()
  maxProjects?: number;

  @IsOptional()
  @IsNumber()
  maxCourses?: number;

  @IsOptional()
  @IsNumber()
  maxProducts?: number;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsString()
  badgeText?: string;

  @IsOptional()
  @IsNumber()
  trialDays?: number;
}

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  monthlyPrice?: number;

  @IsOptional()
  @IsNumber()
  yearlyPrice?: number;

  @IsOptional()
  @IsString()
  stripePriceIdMonthly?: string;

  @IsOptional()
  @IsString()
  stripePriceIdYearly?: string;

  @IsOptional()
  @IsNumber()
  maxUsers?: number;

  @IsOptional()
  @IsNumber()
  maxStorageMb?: number;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @IsOptional()
  @IsString()
  badgeText?: string;
}

export class CreateCheckoutDto {
  @IsString()
  planId: string;

  @IsEnum(['monthly', 'yearly'])
  billingCycle: 'monthly' | 'yearly';

  @IsOptional()
  @IsString()
  successUrl?: string;

  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
