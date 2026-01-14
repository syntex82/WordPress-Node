/**
 * Ads DTOs - Data Transfer Objects for Ads Module
 */
import { IsString, IsOptional, IsNumber, IsArray, IsBoolean, IsDateString } from 'class-validator';

// ADVERTISER DTOs
export class CreateAdvertiserDto {
  @IsString() companyName: string;
  @IsString() contactEmail: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() userId?: string;
}

export class UpdateAdvertiserDto {
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() contactEmail?: string;
  @IsOptional() @IsString() contactName?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsString() status?: string;
}

// CAMPAIGN DTOs
export class CreateCampaignDto {
  @IsString() advertiserId: string;
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsString() type: string;
  @IsNumber() budget: number;
  @IsOptional() @IsNumber() dailyBudget?: number;
  @IsNumber() bidAmount: number;
  @IsOptional() @IsString() targetUrl?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsArray() targetDevices?: string[];
  @IsOptional() @IsArray() targetCountries?: string[];
  @IsOptional() @IsArray() targetPages?: string[];
  @IsOptional() @IsArray() targetHours?: Array<{ start: number; end: number }>;
  @IsOptional() @IsArray() targetDays?: number[];
}

export class UpdateCampaignDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsNumber() budget?: number;
  @IsOptional() @IsNumber() dailyBudget?: number;
  @IsOptional() @IsNumber() bidAmount?: number;
  @IsOptional() @IsString() targetUrl?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsArray() targetDevices?: string[];
  @IsOptional() @IsArray() targetCountries?: string[];
  @IsOptional() @IsArray() targetPages?: string[];
}

// AD DTOs
export class CreateAdDto {
  @IsString() campaignId: string;
  @IsString() name: string;
  @IsString() type: string;
  @IsString() format: string;
  @IsOptional() @IsString() headline?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() html?: string;
  @IsOptional() @IsString() ctaText?: string;
  @IsOptional() @IsNumber() weight?: number;
}

export class UpdateAdDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() headline?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsString() html?: string;
  @IsOptional() @IsString() ctaText?: string;
  @IsOptional() @IsNumber() weight?: number;
  @IsOptional() @IsString() status?: string;
}

// ZONE DTOs
export class CreateZoneDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsString() position: string;
  @IsString() format: string;
  @IsOptional() @IsNumber() width?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsString() fallbackHtml?: string;
  @IsOptional() @IsString() fallbackUrl?: string;
}

export class UpdateZoneDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() position?: string;
  @IsOptional() @IsString() format?: string;
  @IsOptional() @IsNumber() width?: number;
  @IsOptional() @IsNumber() height?: number;
  @IsOptional() @IsString() fallbackHtml?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

// PLACEMENT DTO
export class CreatePlacementDto {
  @IsString() campaignId: string;
  @IsString() zoneId: string;
  @IsOptional() @IsNumber() priority?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

// HOUSE AD DTOs - Ads you run for free on your own site
export class CreateHouseAdDto {
  @IsString() name: string;
  @IsString() type: string; // 'banner', 'native', 'popup'
  @IsString() format: string; // '728x90', '300x250', etc
  @IsOptional() @IsString() headline?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() html?: string;
  @IsString() targetUrl: string; // Where to send clicks
  @IsOptional() @IsString() ctaText?: string;
  @IsOptional() @IsNumber() priority?: number; // Higher = shown more often
  @IsOptional() @IsArray() zones?: string[]; // Which zones to show in
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}

export class UpdateHouseAdDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() headline?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() html?: string;
  @IsOptional() @IsString() targetUrl?: string;
  @IsOptional() @IsString() ctaText?: string;
  @IsOptional() @IsNumber() priority?: number;
  @IsOptional() @IsArray() zones?: string[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}

