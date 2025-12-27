/**
 * Transaction and Payment DTOs
 */

import { IsString, IsNumber, IsOptional, IsEnum, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum MarketplaceTransactionType {
  ESCROW_DEPOSIT = 'ESCROW_DEPOSIT',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  ESCROW_REFUND = 'ESCROW_REFUND',
  PLATFORM_FEE = 'PLATFORM_FEE',
  DEVELOPER_PAYOUT = 'DEVELOPER_PAYOUT',
  DISPUTE_RESOLUTION = 'DISPUTE_RESOLUTION',
}

export enum MarketplaceTransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum DisputeStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED_CLIENT = 'RESOLVED_CLIENT',
  RESOLVED_DEVELOPER = 'RESOLVED_DEVELOPER',
  CLOSED = 'CLOSED',
}

export class CreateEscrowDepositDto {
  @IsUUID()
  projectId: string;

  @IsNumber()
  @Min(1)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  paymentMethodId?: string; // Stripe payment method
}

export class ReleaseEscrowDto {
  @IsUUID()
  projectId: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class RequestPayoutDto {
  @IsNumber()
  @Min(10) // Minimum payout amount
  @Type(() => Number)
  amount: number;

  @IsString()
  @IsOptional()
  payoutMethod?: string;
}

export class CreateDisputeDto {
  @IsUUID()
  projectId: string;

  @IsString()
  reason: string;

  @IsString()
  description: string;

  @IsOptional()
  evidence?: string[];
}

export class ResolveDisputeDto {
  @IsEnum(DisputeStatus)
  resolution: DisputeStatus;

  @IsString()
  resolutionNotes: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  refundAmount?: number;
}

export class TransactionFiltersDto {
  @IsEnum(MarketplaceTransactionType)
  @IsOptional()
  type?: MarketplaceTransactionType;

  @IsEnum(MarketplaceTransactionStatus)
  @IsOptional()
  status?: MarketplaceTransactionStatus;

  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  limit?: number;
}
