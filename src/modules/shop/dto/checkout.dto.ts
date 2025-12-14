/**
 * Checkout DTOs
 */
import { IsString, IsOptional, IsEmail, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { AddressDto } from './order.dto';

export class CheckoutDto {
  @IsEmail()
  email: string;

  @ValidateNested()
  @Type(() => AddressDto)
  billingAddress: AddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress?: AddressDto;

  @IsOptional()
  @IsString()
  shippingMethodId?: string;

  @IsOptional()
  @IsString()
  couponCode?: string;

  @IsOptional()
  @IsString()
  customerNote?: string;
}

export class CreatePaymentIntentDto {
  @IsString()
  orderId: string;
}

export class ConfirmPaymentDto {
  @IsString()
  paymentIntentId: string;

  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}
