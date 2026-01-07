/**
 * Theme Customization Settings DTOs
 * Comprehensive settings for fonts, colors, spacing, shadows, animations
 */

import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
  Max,
  IsHexColor,
} from 'class-validator';
import { Type } from 'class-transformer';

// ============ COLOR SETTINGS ============

export class ColorPaletteDto {
  @IsOptional()
  @IsString()
  primary?: string;

  @IsOptional()
  @IsString()
  secondary?: string;

  @IsOptional()
  @IsString()
  accent?: string;

  @IsOptional()
  @IsString()
  background?: string;

  @IsOptional()
  @IsString()
  surface?: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  textMuted?: string;

  @IsOptional()
  @IsString()
  heading?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  linkHover?: string;

  @IsOptional()
  @IsString()
  border?: string;

  @IsOptional()
  @IsString()
  success?: string;

  @IsOptional()
  @IsString()
  warning?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  info?: string;
}

export class GradientDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsEnum(['linear', 'radial', 'conic'])
  type: 'linear' | 'radial' | 'conic';

  @IsOptional()
  @IsNumber()
  angle?: number;

  @IsArray()
  stops: Array<{ color: string; position: number }>;
}

export class ColorSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ColorPaletteDto)
  palette?: ColorPaletteDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ColorPaletteDto)
  darkMode?: ColorPaletteDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradientDto)
  gradients?: GradientDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  customColors?: string[];
}

// ============ TYPOGRAPHY SETTINGS ============

export class FontFamilyDto {
  @IsString()
  name: string;

  @IsString()
  family: string;

  @IsOptional()
  @IsString()
  fallback?: string;

  @IsOptional()
  @IsString()
  source?: 'google' | 'custom' | 'system';

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  weights?: number[];
}

export class FontSizeScaleDto {
  @IsNumber()
  @Min(10)
  @Max(24)
  base: number;

  @IsOptional()
  @IsNumber()
  scaleRatio?: number; // e.g., 1.25 for major third

  @IsOptional()
  @IsNumber()
  h1?: number;

  @IsOptional()
  @IsNumber()
  h2?: number;

  @IsOptional()
  @IsNumber()
  h3?: number;

  @IsOptional()
  @IsNumber()
  h4?: number;

  @IsOptional()
  @IsNumber()
  h5?: number;

  @IsOptional()
  @IsNumber()
  h6?: number;

  @IsOptional()
  @IsNumber()
  small?: number;

  @IsOptional()
  @IsNumber()
  caption?: number;
}

export class TypographySettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FontFamilyDto)
  headingFont?: FontFamilyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FontFamilyDto)
  bodyFont?: FontFamilyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FontFamilyDto)
  accentFont?: FontFamilyDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FontSizeScaleDto)
  fontSizes?: FontSizeScaleDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  lineHeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  headingLineHeight?: number;

  @IsOptional()
  @IsNumber()
  headingWeight?: number;

  @IsOptional()
  @IsNumber()
  bodyWeight?: number;

  @IsOptional()
  @IsNumber()
  @Min(-2)
  @Max(10)
  letterSpacing?: number;

  @IsOptional()
  @IsEnum(['normal', 'uppercase', 'lowercase', 'capitalize'])
  headingTransform?: 'normal' | 'uppercase' | 'lowercase' | 'capitalize';
}

// ============ SPACING SETTINGS ============

export class SpacingScaleDto {
  @IsOptional()
  @IsNumber()
  xs?: number;

  @IsOptional()
  @IsNumber()
  sm?: number;

  @IsOptional()
  @IsNumber()
  md?: number;

  @IsOptional()
  @IsNumber()
  lg?: number;

  @IsOptional()
  @IsNumber()
  xl?: number;

  @IsOptional()
  @IsNumber()
  xxl?: number;
}

export class SpacingSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => SpacingScaleDto)
  scale?: SpacingScaleDto;

  @IsOptional()
  @IsNumber()
  sectionPadding?: number;

  @IsOptional()
  @IsNumber()
  elementSpacing?: number;

  @IsOptional()
  @IsNumber()
  containerPadding?: number;

  @IsOptional()
  @IsNumber()
  blockGap?: number;

  @IsOptional()
  @IsNumber()
  gridGap?: number;
}

// ============ BORDER & SHADOW SETTINGS ============

export class BorderSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  radius?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  width?: number;

  @IsOptional()
  @IsEnum(['solid', 'dashed', 'dotted', 'double', 'none'])
  style?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';

  @IsOptional()
  @IsString()
  color?: string;
}

export class ShadowDto {
  @IsString()
  name: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;

  @IsNumber()
  blur: number;

  @IsNumber()
  spread: number;

  @IsString()
  color: string;

  @IsOptional()
  @IsBoolean()
  inset?: boolean;
}

export class ShadowSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ShadowDto)
  small?: ShadowDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShadowDto)
  medium?: ShadowDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShadowDto)
  large?: ShadowDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShadowDto)
  custom?: ShadowDto[];
}

// ============ ANIMATION SETTINGS ============

export class AnimationSettingsDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2000)
  duration?: number;

  @IsOptional()
  @IsEnum(['ease', 'ease-in', 'ease-out', 'ease-in-out', 'linear', 'spring'])
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | 'spring';

  @IsOptional()
  @IsBoolean()
  reduceMotion?: boolean;

  @IsOptional()
  @IsBoolean()
  scrollAnimations?: boolean;

  @IsOptional()
  @IsBoolean()
  hoverEffects?: boolean;

  @IsOptional()
  @IsBoolean()
  pageTransitions?: boolean;
}

// ============ LAYOUT SETTINGS ============

export class LayoutSettingsDto {
  @IsOptional()
  @IsNumber()
  @Min(800)
  @Max(2000)
  contentWidth?: number;

  @IsOptional()
  @IsNumber()
  @Min(800)
  @Max(2560)
  containerMaxWidth?: number;

  @IsOptional()
  @IsEnum(['none', 'left', 'right'])
  sidebarPosition?: 'none' | 'left' | 'right';

  @IsOptional()
  @IsNumber()
  @Min(200)
  @Max(500)
  sidebarWidth?: number;

  @IsOptional()
  @IsEnum(['default', 'centered', 'minimal', 'sticky', 'transparent'])
  headerStyle?: 'default' | 'centered' | 'minimal' | 'sticky' | 'transparent';

  @IsOptional()
  @IsNumber()
  headerHeight?: number;

  @IsOptional()
  @IsEnum(['default', 'centered', 'minimal', 'multicolumn'])
  footerStyle?: 'default' | 'centered' | 'minimal' | 'multicolumn';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(6)
  footerColumns?: number;
}

// ============ RESPONSIVE SETTINGS ============

export class BreakpointDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(320)
  @Max(2560)
  width: number;
}

export class ResponsiveSettingsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BreakpointDto)
  breakpoints?: BreakpointDto[];

  @IsOptional()
  @IsObject()
  tablet?: Partial<LayoutSettingsDto>;

  @IsOptional()
  @IsObject()
  mobile?: Partial<LayoutSettingsDto>;
}

// ============ COMPONENT SETTINGS ============

export class ButtonStyleDto {
  @IsOptional()
  @IsNumber()
  borderRadius?: number;

  @IsOptional()
  @IsString()
  padding?: string;

  @IsOptional()
  @IsNumber()
  fontWeight?: number;

  @IsOptional()
  @IsEnum(['uppercase', 'capitalize', 'none'])
  textTransform?: 'uppercase' | 'capitalize' | 'none';

  @IsOptional()
  @IsBoolean()
  shadow?: boolean;
}

export class CardStyleDto {
  @IsOptional()
  @IsNumber()
  borderRadius?: number;

  @IsOptional()
  @IsString()
  shadow?: string;

  @IsOptional()
  @IsNumber()
  padding?: number;

  @IsOptional()
  @IsBoolean()
  border?: boolean;

  @IsOptional()
  @IsBoolean()
  hoverEffect?: boolean;
}

export class FormStyleDto {
  @IsOptional()
  @IsNumber()
  borderRadius?: number;

  @IsOptional()
  @IsNumber()
  borderWidth?: number;

  @IsOptional()
  @IsString()
  focusColor?: string;

  @IsOptional()
  @IsString()
  labelPosition?: 'top' | 'left' | 'floating';
}

export class ComponentSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ButtonStyleDto)
  buttons?: ButtonStyleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CardStyleDto)
  cards?: CardStyleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => FormStyleDto)
  forms?: FormStyleDto;
}

// ============ COMPLETE SETTINGS ============

export class CompleteThemeSettingsDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => ColorSettingsDto)
  colors?: ColorSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TypographySettingsDto)
  typography?: TypographySettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SpacingSettingsDto)
  spacing?: SpacingSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => BorderSettingsDto)
  borders?: BorderSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ShadowSettingsDto)
  shadows?: ShadowSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AnimationSettingsDto)
  animations?: AnimationSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => LayoutSettingsDto)
  layout?: LayoutSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ResponsiveSettingsDto)
  responsive?: ResponsiveSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => ComponentSettingsDto)
  components?: ComponentSettingsDto;
}

export class UpdateThemeSettingsDto {
  @IsString()
  themeId: string;

  @ValidateNested()
  @Type(() => CompleteThemeSettingsDto)
  settings: CompleteThemeSettingsDto;

  @IsOptional()
  @IsBoolean()
  merge?: boolean; // Merge with existing or replace
}
