/**
 * Create Page Customization DTO
 */

export class CreatePageCustomizationDto {
  pageId: string;
  layout?: string; // 'default', 'full-width', 'sidebar-left', 'sidebar-right'
  showHeader?: boolean;
  showFooter?: boolean;
  showSidebar?: boolean;
  customCSS?: string;
  backgroundColor?: string;
  textColor?: string;
  headerStyle?: string; // 'default', 'minimal', 'transparent'
  footerStyle?: string; // 'default', 'minimal', 'full'
  featuredImagePosition?: string; // 'top', 'background', 'hidden'
  customFields?: Record<string, any>;
}
