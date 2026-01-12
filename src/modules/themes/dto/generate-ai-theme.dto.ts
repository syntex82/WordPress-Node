/**
 * Generate AI Theme DTO
 * Validates input for AI-powered theme generation
 */

import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';

/**
 * Industry types for targeted theme generation
 */
export type IndustryType =
  | 'technology'
  | 'ecommerce'
  | 'education'
  | 'healthcare'
  | 'finance'
  | 'restaurant'
  | 'portfolio'
  | 'blog'
  | 'agency'
  | 'nonprofit'
  | 'entertainment'
  | 'fitness'
  | 'travel'
  | 'realestate'
  | 'saas'
  | 'general';

/**
 * Page types that can be generated
 */
export type PageType =
  | 'home'
  | 'about'
  | 'services'
  | 'products'
  | 'blog'
  | 'contact'
  | 'pricing'
  | 'faq'
  | 'team'
  | 'portfolio'
  | 'courses'
  | 'shop'
  | 'checkout'
  | 'login'
  | 'register';

/**
 * Block types available for content generation
 */
export type ContentBlockType =
  // Core content blocks
  | 'hero'
  | 'features'
  | 'testimonials'
  | 'testimonial' // Singular version for single testimonial blocks
  | 'cta'
  | 'gallery'
  | 'video'
  | 'audio'
  | 'pricing'
  | 'stats'
  | 'timeline'
  | 'accordion'
  | 'newsletter'
  | 'logoCloud'
  | 'socialProof'
  | 'countdown'
  | 'imageText'
  | 'about'
  | 'map'
  | 'faq'
  | 'content'
  | 'footer'
  // E-commerce blocks
  | 'productGrid'
  | 'productCard'
  | 'productCarousel'
  | 'shoppingCart'
  | 'checkoutForm'
  | 'orderSummary'
  | 'shopFilters'
  // Course/LMS blocks
  | 'courseGrid'
  | 'courseCard'
  | 'courseCurriculum'
  | 'courseProgress'
  | 'courseInstructor'
  | 'courseCategories'
  // Blog blocks
  | 'blogPosts'
  | 'blogGrid'
  | 'blogCategories'
  // Team/People blocks
  | 'teamGrid'
  // Contact blocks
  | 'contactForm'
  | 'contactInfo'
  // Restaurant blocks
  | 'menuPreview'
  | 'menuSection'
  | 'reservationForm'
  // Healthcare blocks
  | 'appointmentForm'
  // Real Estate blocks
  | 'propertySearch'
  | 'propertyGrid'
  // Portfolio blocks
  | 'projectGrid'
  // Automotive blocks
  | 'vehicleSearch'
  | 'vehicleGrid'
  // Fitness blocks
  | 'schedule'
  // Nonprofit blocks
  | 'donationForm'
  // Travel blocks
  | 'tourPackages'
  | 'destinationGrid'
  | 'searchBar'
  // Fashion blocks
  | 'splitContent'
  // Education blocks
  | 'programList'
  // Auth blocks
  | 'loginForm';

/**
 * Theme feature flags
 */
export interface ThemeFeatures {
  darkMode?: boolean;
  animations?: boolean;
  responsiveImages?: boolean;
  lazyLoading?: boolean;
  stickyHeader?: boolean;
  backToTop?: boolean;
  socialSharing?: boolean;
  searchBar?: boolean;
  newsletter?: boolean;
  chatWidget?: boolean;
  customFonts?: boolean;
  parallax?: boolean;
  breadcrumbs?: boolean;
  rtlSupport?: boolean;
  multiLanguage?: boolean;
  pwa?: boolean;
}

export class GenerateAiThemeDto {
  @IsString()
  @IsOptional()
  prompt?: string;

  @IsString()
  @IsOptional()
  presetId?: string;

  @IsBoolean()
  @IsOptional()
  usePreset?: boolean;

  @IsString()
  @IsOptional()
  themeName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(10)
  numberOfPages?: number;

  @IsString()
  @IsOptional()
  style?: 'modern' | 'minimal' | 'bold' | 'professional' | 'creative' | 'elegant' | 'playful';

  @IsString()
  @IsOptional()
  colorScheme?: 'light' | 'dark' | 'auto';

  @IsString()
  @IsOptional()
  industry?: IndustryType;

  @IsArray()
  @IsOptional()
  pageTypes?: PageType[];

  @IsArray()
  @IsOptional()
  preferredBlocks?: ContentBlockType[];

  @IsOptional()
  features?: ThemeFeatures;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @IsString()
  @IsOptional()
  fontFamily?: string;

  @IsBoolean()
  @IsOptional()
  includeEcommerce?: boolean;

  @IsBoolean()
  @IsOptional()
  includeCourses?: boolean;

  @IsBoolean()
  @IsOptional()
  includeBlog?: boolean;

  @IsString()
  @IsOptional()
  headerStyle?: 'default' | 'sticky' | 'minimal' | 'centered' | 'mega';

  @IsString()
  @IsOptional()
  footerStyle?: 'default' | 'minimal' | 'centered' | 'multicolumn';

  @IsBoolean()
  @IsOptional()
  generateFullTheme?: boolean;
}
