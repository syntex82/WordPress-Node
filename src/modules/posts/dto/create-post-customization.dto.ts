/**
 * Create Post Customization DTO
 */

export class CreatePostCustomizationDto {
  postId: string;
  layout?: string; // 'default', 'full-width', 'sidebar-left', 'sidebar-right'
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
  featuredImagePosition?: string; // 'top', 'background', 'hidden'
  customFields?: Record<string, any>;
}
