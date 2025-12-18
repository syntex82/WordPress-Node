/**
 * Update Post Customization DTO
 */

export class UpdatePostCustomizationDto {
  layout?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showSidebar?: boolean;
  showAuthor?: boolean;
  showDate?: boolean;
  showCategory?: boolean;
  showTags?: boolean;
  showRelatedPosts?: boolean;
  relatedPostsCount?: number;
  customCSS?: string;
  backgroundColor?: string;
  textColor?: string;
  featuredImagePosition?: string;
  customFields?: Record<string, any>;
}

