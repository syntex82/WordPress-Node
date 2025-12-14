/**
 * Cart DTOs
 */
import { IsString, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  variantId?: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateCartItemDto {
  @IsNumber()
  @Min(0)
  quantity: number;
}

export class ApplyCouponDto {
  @IsString()
  code: string;
}
