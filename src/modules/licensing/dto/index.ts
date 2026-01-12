/**
 * Licensing DTOs
 */

import { IsString, IsEmail, IsEnum, IsOptional, IsArray, IsNumber, Min } from 'class-validator';

export enum LicenseTier {
  PERSONAL = 'PERSONAL',
  PROFESSIONAL = 'PROFESSIONAL',
  AGENCY = 'AGENCY',
  ENTERPRISE = 'ENTERPRISE',
}

export class CreateLicenseDto {
  @IsEmail()
  email: string;

  @IsEnum(LicenseTier)
  tier: LicenseTier;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsOptional()
  @IsString()
  orderId?: string;
}

export class ActivateLicenseDto {
  @IsString()
  licenseKey: string;

  @IsString()
  domain: string;

  @IsOptional()
  serverInfo?: Record<string, any>;
}

export class ValidateLicenseDto {
  @IsString()
  licenseKey: string;

  @IsOptional()
  @IsString()
  domain?: string;
}

export class DeactivateLicenseDto {
  @IsString()
  licenseKey: string;

  @IsString()
  domain: string;
}

export class TransferLicenseDto {
  @IsString()
  licenseKey: string;

  @IsEmail()
  newEmail: string;

  @IsOptional()
  @IsString()
  newCustomerName?: string;
}

// License tier configuration
export const LICENSE_TIER_CONFIG = {
  [LicenseTier.PERSONAL]: {
    name: 'Personal',
    price: 49,
    maxSites: 1,
    lifetime: false,
    updatePeriodDays: 365,
    features: ['basic_cms', 'media_library', 'seo', 'themes'],
    description: 'Perfect for personal blogs and small sites',
  },
  [LicenseTier.PROFESSIONAL]: {
    name: 'Professional',
    price: 149,
    maxSites: 5,
    lifetime: false,
    updatePeriodDays: 365,
    features: ['basic_cms', 'media_library', 'seo', 'themes', 'ecommerce', 'lms', 'analytics', 'api_access'],
    description: 'Great for freelancers and small businesses',
  },
  [LicenseTier.AGENCY]: {
    name: 'Agency',
    price: 299,
    maxSites: -1, // unlimited
    lifetime: true,
    updatePeriodDays: -1, // lifetime
    features: ['basic_cms', 'media_library', 'seo', 'themes', 'ecommerce', 'lms', 'analytics', 'api_access', 'white_label', 'priority_support'],
    description: 'Unlimited sites for agencies and developers',
  },
  [LicenseTier.ENTERPRISE]: {
    name: 'Enterprise',
    price: 999,
    maxSites: -1,
    lifetime: true,
    updatePeriodDays: -1,
    features: ['basic_cms', 'media_library', 'seo', 'themes', 'ecommerce', 'lms', 'analytics', 'api_access', 'white_label', 'priority_support', 'custom_deployment', 'sla', 'dedicated_support'],
    description: 'Enterprise features with dedicated support and SLA',
  },
};

