/**
 * Update Page Customization DTO
 */

export class UpdatePageCustomizationDto {
  layout?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showSidebar?: boolean;
  customCSS?: string;
  backgroundColor?: string;
  textColor?: string;
  headerStyle?: string;
  footerStyle?: string;
  featuredImagePosition?: string;
  customFields?: Record<string, any>;
}

