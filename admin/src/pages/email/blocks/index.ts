/**
 * Email Template Designer - Enhanced Block Library
 * Professional email blocks for e-commerce, LMS, blog, and SaaS
 */

import { 
  FiLayout, FiType, FiImage, FiSquare, FiMinus, FiGrid, FiLink, FiStar, FiCheck, FiMail,
  FiColumns, FiShoppingCart, FiPackage, FiTag, FiPercent, FiGift, FiTruck,
  FiBook, FiAward, FiUsers, FiTrendingUp, FiBarChart2, FiPlay,
  FiFileText, FiUser, FiBookmark, FiRss, FiHeart,
  FiClock, FiThumbsUp, FiMessageCircle, FiShare2, FiVideo,
  FiLayers, FiList, FiChevronDown, FiExternalLink
} from 'react-icons/fi';

// Block Types - Extended
export type BlockType = 
  // Layout
  | 'header' | 'footer' | 'divider' | 'spacer' | 'columns' | 'section'
  // Content
  | 'text' | 'image' | 'button' | 'hero' | 'cta' | 'features' | 'testimonial' | 'social'
  // E-commerce
  | 'productShowcase' | 'productGrid' | 'cartAbandonment' | 'orderConfirmation' 
  | 'productRecommendations' | 'discountCode' | 'saleAnnouncement'
  // LMS/Course
  | 'courseCard' | 'lessonProgress' | 'certificateAnnouncement' | 'achievement'
  | 'courseRecommendations' | 'instructorSpotlight'
  // Blog/Content
  | 'featuredArticle' | 'blogSummary' | 'authorBio' | 'relatedPosts' | 'newsletterSignup'
  // Interactive
  | 'countdown' | 'progressBar' | 'rating' | 'videoEmbed' | 'imageGallery'
  // Advanced Layout
  | 'accordion' | 'tabs' | 'iconList' | 'statsGrid';

export interface EmailBlock {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  styles: Record<string, any>;
  conditional?: {
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan';
    value: string;
  };
}

export interface EmailDesign {
  blocks: EmailBlock[];
  globalStyles: {
    backgroundColor: string;
    contentWidth: number;
    fontFamily: string;
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    linkColor: string;
    borderRadius: number;
  };
}

// Block Categories
export const BLOCK_CATEGORIES: Record<string, BlockType[]> = {
  'Layout': ['header', 'footer', 'divider', 'spacer', 'columns', 'section'],
  'Content': ['text', 'image', 'button', 'hero', 'cta', 'features', 'testimonial', 'social'],
  'E-commerce': ['productShowcase', 'productGrid', 'cartAbandonment', 'orderConfirmation', 'productRecommendations', 'discountCode', 'saleAnnouncement'],
  'Courses': ['courseCard', 'lessonProgress', 'certificateAnnouncement', 'achievement', 'courseRecommendations', 'instructorSpotlight'],
  'Blog': ['featuredArticle', 'blogSummary', 'authorBio', 'relatedPosts', 'newsletterSignup'],
  'Interactive': ['countdown', 'progressBar', 'rating', 'videoEmbed', 'imageGallery'],
  'Advanced': ['accordion', 'tabs', 'iconList', 'statsGrid']
};

// Block Info with icons
export const BLOCK_INFO: Record<BlockType, { label: string; icon: any; description: string }> = {
  // Layout
  header: { label: 'Header', icon: FiLayout, description: 'Logo and brand header' },
  footer: { label: 'Footer', icon: FiLayout, description: 'Footer with links' },
  divider: { label: 'Divider', icon: FiMinus, description: 'Horizontal separator' },
  spacer: { label: 'Spacer', icon: FiGrid, description: 'Vertical spacing' },
  columns: { label: 'Columns', icon: FiColumns, description: 'Multi-column layout' },
  section: { label: 'Section', icon: FiLayers, description: 'Grouped content section' },
  
  // Content
  text: { label: 'Text', icon: FiType, description: 'Rich text content' },
  image: { label: 'Image', icon: FiImage, description: 'Single image' },
  button: { label: 'Button', icon: FiSquare, description: 'Call-to-action button' },
  hero: { label: 'Hero', icon: FiStar, description: 'Hero banner section' },
  cta: { label: 'CTA', icon: FiMail, description: 'Call-to-action block' },
  features: { label: 'Features', icon: FiCheck, description: 'Feature list' },
  testimonial: { label: 'Testimonial', icon: FiMessageCircle, description: 'Customer quote' },
  social: { label: 'Social Links', icon: FiLink, description: 'Social media icons' },
  
  // E-commerce
  productShowcase: { label: 'Product Showcase', icon: FiPackage, description: 'Featured product display' },
  productGrid: { label: 'Product Grid', icon: FiGrid, description: 'Multiple products grid' },
  cartAbandonment: { label: 'Cart Reminder', icon: FiShoppingCart, description: 'Abandoned cart items' },
  orderConfirmation: { label: 'Order Summary', icon: FiCheck, description: 'Order confirmation details' },
  productRecommendations: { label: 'Recommendations', icon: FiHeart, description: 'Recommended products' },
  discountCode: { label: 'Discount Code', icon: FiPercent, description: 'Promo code display' },
  saleAnnouncement: { label: 'Sale Banner', icon: FiTag, description: 'Sale announcement' },
  
  // LMS/Courses
  courseCard: { label: 'Course Card', icon: FiBook, description: 'Course preview card' },
  lessonProgress: { label: 'Lesson Progress', icon: FiTrendingUp, description: 'Progress tracker' },
  certificateAnnouncement: { label: 'Certificate', icon: FiAward, description: 'Certificate earned' },
  achievement: { label: 'Achievement', icon: FiStar, description: 'Achievement badge' },
  courseRecommendations: { label: 'Course Recs', icon: FiBookmark, description: 'Suggested courses' },
  instructorSpotlight: { label: 'Instructor', icon: FiUser, description: 'Instructor profile' },
  
  // Blog/Content
  featuredArticle: { label: 'Featured Post', icon: FiFileText, description: 'Featured article' },
  blogSummary: { label: 'Blog Summary', icon: FiRss, description: 'Post summary' },
  authorBio: { label: 'Author Bio', icon: FiUser, description: 'Author information' },
  relatedPosts: { label: 'Related Posts', icon: FiBookmark, description: 'Related articles' },
  newsletterSignup: { label: 'Newsletter', icon: FiMail, description: 'Email signup' },
  
  // Interactive
  countdown: { label: 'Countdown', icon: FiClock, description: 'Timer countdown' },
  progressBar: { label: 'Progress Bar', icon: FiBarChart2, description: 'Progress indicator' },
  rating: { label: 'Rating', icon: FiThumbsUp, description: 'Star rating display' },
  videoEmbed: { label: 'Video', icon: FiVideo, description: 'Video thumbnail' },
  imageGallery: { label: 'Gallery', icon: FiImage, description: 'Image gallery' },
  
  // Advanced
  accordion: { label: 'Accordion', icon: FiChevronDown, description: 'Expandable sections' },
  tabs: { label: 'Tabs', icon: FiList, description: 'Tabbed content' },
  iconList: { label: 'Icon List', icon: FiList, description: 'List with icons' },
  statsGrid: { label: 'Stats', icon: FiBarChart2, description: 'Statistics display' }
};

export * from './ecommerce-blocks';
export * from './lms-blocks';
export * from './blog-blocks';
export * from './interactive-blocks';
export * from './templates';

