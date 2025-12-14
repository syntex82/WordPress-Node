/**
 * Create Menu DTO
 */

import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  label: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  target?: string = '_self';

  @IsString()
  @IsOptional()
  type?: string = 'CUSTOM';

  @IsString()
  @IsOptional()
  pageId?: string;

  @IsString()
  @IsOptional()
  postId?: string;

  @IsOptional()
  order?: number = 0;

  @IsString()
  @IsOptional()
  cssClass?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}

export class CreateMenuDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMenuItemDto)
  @IsOptional()
  items?: CreateMenuItemDto[];
}
