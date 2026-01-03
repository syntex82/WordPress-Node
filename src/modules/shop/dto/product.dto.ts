/**
 * Product DTOs
 */
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  IsUUID,
  Min,
  ValidateNested,
  IsInt,
  ValidateIf,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

export enum ProductType {
  PHYSICAL = 'PHYSICAL',
  DIGITAL = 'DIGITAL',
  SERVICE = 'SERVICE',
}

// Standard clothing sizes
export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] as const;
export type ClothingSize = (typeof CLOTHING_SIZES)[number];

// Color option definition
export class ColorOptionDto {
  @IsString()
  name: string; // e.g., "Red", "Navy Blue"

  @IsString()
  code: string; // Hex code e.g., "#FF0000"

  @IsOptional()
  @IsString()
  image?: string; // Swatch image URL (optional)
}

// Variant options configuration for a product
export class VariantOptionsDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sizes?: string[]; // Available sizes: ["S", "M", "L", "XL"]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorOptionDto)
  colors?: ColorOptionDto[]; // Available colors with codes
}

export class CreateVariantDto {
  @IsString()
  name: string; // e.g., "Large / Red"

  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsString()
  image?: string; // Main variant image

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[]; // Additional variant images

  // Explicit clothing variant fields
  @IsOptional()
  @IsString()
  size?: string; // XS, S, M, L, XL, XXL

  @IsOptional()
  @IsString()
  color?: string; // Color name

  @IsOptional()
  @IsString()
  colorCode?: string; // Hex color code

  @IsOptional()
  options?: Record<string, string>; // Additional custom options

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  shortDescription?: string;

  @IsOptional()
  @IsString()
  sku?: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional()
  @IsString()
  featuredImage?: string;

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  dimensions?: { length?: number; width?: number; height?: number };

  // Variant configuration for clothing/apparel
  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => VariantOptionsDto)
  variantOptions?: VariantOptionsDto; // {sizes: ["S","M"], colors: [{name:"Red",code:"#FF0000"}]}

  @IsOptional()
  @IsString()
  downloadUrl?: string;

  @IsOptional()
  @IsNumber()
  downloadLimit?: number;

  @IsOptional()
  @IsNumber()
  downloadExpiry?: number;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @ValidateIf((o) => o.categoryId !== undefined && o.categoryId !== null && o.categoryId !== '')
  @IsUUID()
  categoryId?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}

export class UpdateProductDto extends CreateProductDto {}

// DTO for generating variant combinations automatically
export class GenerateVariantsDto {
  @IsArray()
  @IsString({ each: true })
  sizes: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ColorOptionDto)
  colors: ColorOptionDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultPrice?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  defaultStock?: number;
}

// DTO for updating variant stock
export class UpdateVariantStockDto {
  @IsUUID()
  variantId: string;

  @IsInt()
  stock: number;

  @IsOptional()
  @IsString()
  reason?: string; // Stock adjustment reason
}

export class ProductQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 20;
}
