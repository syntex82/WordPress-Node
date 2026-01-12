/**
 * Professional Services DTOs
 */

import { IsString, IsEnum, IsOptional, IsNumber, IsBoolean, IsArray, Min, IsDateString } from 'class-validator';

export enum ServiceCategory {
  CONSULTING = 'CONSULTING',
  DEVELOPMENT = 'DEVELOPMENT',
  TRAINING = 'TRAINING',
  SUPPORT = 'SUPPORT',
  MIGRATION = 'MIGRATION',
  HOSTING = 'HOSTING',
  DESIGN = 'DESIGN',
  SECURITY = 'SECURITY',
}

export enum PriceType {
  HOURLY = 'HOURLY',
  FIXED = 'FIXED',
  SUBSCRIPTION = 'SUBSCRIPTION',
  QUOTE = 'QUOTE',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @IsEnum(PriceType)
  priceType: PriceType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedPrice?: number;

  @IsOptional()
  @IsNumber()
  minHours?: number;

  @IsOptional()
  @IsNumber()
  maxHours?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsArray()
  deliverables?: string[];

  @IsOptional()
  @IsString()
  image?: string;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(PriceType)
  priceType?: PriceType;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedPrice?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsArray()
  deliverables?: string[];
}

export class CreateBookingDto {
  @IsString()
  serviceId: string;

  @IsOptional()
  @IsDateString()
  scheduledDate?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  hours?: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  requirements?: Record<string, any>;
}

export class UpdateBookingStatusDto {
  @IsEnum(BookingStatus)
  status: BookingStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

// Default professional services
export const DEFAULT_SERVICES = [
  {
    name: 'NodePress Setup & Configuration',
    slug: 'nodepress-setup',
    description: 'Complete setup of NodePress CMS on your server including database configuration, environment setup, SSL, and initial customization.',
    category: ServiceCategory.DEVELOPMENT,
    priceType: PriceType.FIXED,
    fixedPrice: 299,
    features: ['Server configuration', 'Database setup', 'SSL installation', 'Basic customization', 'Admin training'],
    deliverables: ['Fully configured NodePress', 'Admin credentials', 'Documentation'],
  },
  {
    name: 'Custom Plugin Development',
    slug: 'custom-plugin',
    description: 'Custom plugin development to extend NodePress functionality for your specific needs.',
    category: ServiceCategory.DEVELOPMENT,
    priceType: PriceType.HOURLY,
    hourlyRate: 150,
    minHours: 4,
    features: ['Requirements analysis', 'Custom development', 'Testing', 'Documentation', '30-day support'],
    deliverables: ['Custom plugin code', 'Installation guide', 'Source code'],
  },
  {
    name: 'Theme Customization',
    slug: 'theme-customization',
    description: 'Professional theme customization to match your brand identity.',
    category: ServiceCategory.DESIGN,
    priceType: PriceType.FIXED,
    fixedPrice: 499,
    features: ['Brand integration', 'Color scheme', 'Typography', 'Layout adjustments', 'Mobile optimization'],
    deliverables: ['Custom theme', 'Style guide'],
  },
  {
    name: 'Technical Consulting',
    slug: 'consulting',
    description: 'Expert consultation on NodePress architecture, performance, security, and scaling.',
    category: ServiceCategory.CONSULTING,
    priceType: PriceType.HOURLY,
    hourlyRate: 200,
    minHours: 1,
    features: ['Architecture review', 'Performance audit', 'Security assessment', 'Scaling strategy', 'Best practices'],
    deliverables: ['Consultation summary', 'Recommendations document'],
  },
  {
    name: 'Priority Support Plan',
    slug: 'priority-support',
    description: 'Monthly priority support with guaranteed response times and dedicated assistance.',
    category: ServiceCategory.SUPPORT,
    priceType: PriceType.SUBSCRIPTION,
    fixedPrice: 99,
    features: ['4-hour response time', 'Live chat support', 'Phone support', 'Priority bug fixes', 'Monthly check-in'],
    deliverables: ['Direct support channel', 'Monthly reports'],
  },
  {
    name: 'Migration Service',
    slug: 'migration',
    description: 'Complete migration from WordPress, Drupal, or other CMS platforms to NodePress.',
    category: ServiceCategory.MIGRATION,
    priceType: PriceType.QUOTE,
    features: ['Content migration', 'User migration', 'SEO preservation', 'Redirect setup', 'Testing'],
    deliverables: ['Migrated content', 'Redirect map', 'Migration report'],
  },
];

