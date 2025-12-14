/**
 * Content Block System for Theme Designer
 * Provides draggable content blocks for building theme previews
 */
import React, { useState } from 'react';
import {
  FiMusic, FiVideo, FiImage, FiSquare, FiStar, FiMessageSquare,
  FiGrid, FiMinus, FiPlay, FiPause, FiVolume2, FiVolumeX,
  FiMaximize, FiX, FiChevronLeft, FiChevronRight, FiTrash2,
  FiMove, FiPlus, FiArrowUp, FiArrowDown, FiCopy, FiEye, FiEyeOff,
  FiBook, FiList, FiTrendingUp, FiUser, FiFolder, FiShoppingCart,
  FiFilter, FiCreditCard, FiPercent, FiUpload
} from 'react-icons/fi';
import { CustomThemeSettings } from '../../services/api';
import MediaPickerModal from '../MediaPickerModal';

import {
  LinkSettings, BlockVisibility, AnimationSettings, RowSettings, HeaderSettings, ProductData,
  LinkSettingsForm, VisibilitySettings, AnimationSettingsForm,
  RowBlock, ProductCardBlock, ProductGridBlock, FeaturedProductBlock, ProductCarouselBlock,
  HeaderBuilderBlock, HeaderSettingsPanel, PRESET_LAYOUTS, ANIMATION_PRESETS,
  // Course/LMS types and components
  CourseData as AdvancedCourseData, CourseCategoryData as AdvancedCourseCategoryData,
  CourseProgressData, InstructorData, ModuleData as AdvancedModuleData,
  CourseCardBlock, CourseGridBlock, CourseCurriculumBlock, CourseProgressBlock,
  CourseInstructorBlock, CourseCategoriesBlock,
  // Shop/E-commerce types and components
  CartData, ProductCategory,
  ShoppingCartBlock, ProductCategoriesBlock, ProductFilterBlock,
  CheckoutSummaryBlock, SaleBannerBlock
} from './AdvancedBlocks';

// ============ Block Type Definitions ============
export type BlockType =
  | 'audio' | 'video' | 'gallery' | 'button' | 'hero'
  | 'card' | 'testimonial' | 'cta' | 'features' | 'divider'
  | 'pricing' | 'stats' | 'timeline' | 'accordion' | 'tabs'
  | 'imageText' | 'logoCloud' | 'newsletter' | 'socialProof' | 'countdown'
  | 'row' | 'header' | 'productCard' | 'productGrid' | 'featuredProduct' | 'productCarousel'
  // Course/LMS blocks
  | 'courseCard' | 'courseGrid' | 'courseCurriculum' | 'courseProgress' | 'courseInstructor' | 'courseCategories'
  // Shop/E-commerce blocks
  | 'shoppingCart' | 'productCategories' | 'productFilter' | 'checkoutSummary' | 'saleBanner';

export interface ContentBlock {
  id: string;
  type: BlockType;
  props: Record<string, any>;
  link?: LinkSettings;
  visibility?: BlockVisibility;
  animation?: AnimationSettings;
}

// Re-export advanced block types for use elsewhere
export type { LinkSettings, BlockVisibility, AnimationSettings, RowSettings, HeaderSettings, ProductData };
export type { CourseData, CourseCategoryData, CourseProgressData, InstructorData, ModuleData, CartData, ProductCategory };
export { LinkSettingsForm, VisibilitySettings, AnimationSettingsForm, HeaderSettingsPanel, PRESET_LAYOUTS, ANIMATION_PRESETS };

// Block configurations with defaults
export const BLOCK_CONFIGS: Record<BlockType, { label: string; icon: React.ElementType; defaultProps: Record<string, any> }> = {
  audio: {
    label: 'Audio Player',
    icon: FiMusic,
    defaultProps: {
      title: 'Track Title',
      artist: 'Artist Name',
      albumArt: 'https://picsum.photos/200',
      audioUrl: '',
    },
  },
  video: {
    label: 'Video Player',
    icon: FiVideo,
    defaultProps: {
      videoUrl: '',
      posterUrl: 'https://picsum.photos/800/450',
      title: 'Video Title',
    },
  },
  gallery: {
    label: 'Image Gallery',
    icon: FiImage,
    defaultProps: {
      layout: 'grid',
      columns: 3,
      images: [
        { src: 'https://picsum.photos/400/300?1', caption: 'Image 1' },
        { src: 'https://picsum.photos/400/300?2', caption: 'Image 2' },
        { src: 'https://picsum.photos/400/300?3', caption: 'Image 3' },
      ],
    },
  },
  button: {
    label: 'Button',
    icon: FiSquare,
    defaultProps: {
      text: 'Click Me',
      style: 'solid',
      size: 'medium',
      icon: null,
      iconPosition: 'left',
      url: '#',
    },
  },
  hero: {
    label: 'Hero Section',
    icon: FiMaximize,
    defaultProps: {
      title: 'Welcome to Our Site',
      subtitle: 'Discover amazing content and experiences',
      ctaText: 'Get Started',
      ctaUrl: '#',
      backgroundImage: 'https://picsum.photos/1920/800',
      overlay: 0.5,
      alignment: 'center',
    },
  },
  card: {
    label: 'Card',
    icon: FiSquare,
    defaultProps: {
      image: 'https://picsum.photos/400/250',
      title: 'Card Title',
      description: 'This is a sample card description with some text content.',
      buttonText: 'Learn More',
      buttonUrl: '#',
      variant: 'default',
    },
  },
  testimonial: {
    label: 'Testimonial',
    icon: FiMessageSquare,
    defaultProps: {
      quote: 'This product has completely transformed how we work. Highly recommended!',
      author: 'John Doe',
      role: 'CEO, Company Inc.',
      avatar: 'https://i.pravatar.cc/100',
      rating: 5,
    },
  },
  cta: {
    label: 'Call to Action',
    icon: FiArrowUp,
    defaultProps: {
      heading: 'Ready to Get Started?',
      description: 'Join thousands of satisfied customers today.',
      buttonText: 'Sign Up Now',
      buttonUrl: '#',
      backgroundType: 'gradient',
      backgroundColor: '#3b82f6',
    },
  },
  features: {
    label: 'Feature Grid',
    icon: FiGrid,
    defaultProps: {
      columns: 3,
      features: [
        { icon: '🚀', title: 'Fast', description: 'Lightning quick performance' },
        { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' },
        { icon: '💎', title: 'Premium', description: 'High-quality experience' },
      ],
    },
  },
  divider: {
    label: 'Divider',
    icon: FiMinus,
    defaultProps: {
      style: 'solid',
      spacing: 40,
      color: '',
    },
  },
  pricing: {
    label: 'Pricing Table',
    icon: FiGrid,
    defaultProps: {
      plans: [
        { name: 'Starter', price: '$9', period: '/month', features: ['5 Projects', '10GB Storage', 'Email Support'], highlighted: false, buttonText: 'Get Started' },
        { name: 'Pro', price: '$29', period: '/month', features: ['Unlimited Projects', '100GB Storage', 'Priority Support', 'API Access'], highlighted: true, buttonText: 'Start Free Trial' },
        { name: 'Enterprise', price: '$99', period: '/month', features: ['Everything in Pro', 'Unlimited Storage', '24/7 Support', 'Custom Integrations'], highlighted: false, buttonText: 'Contact Sales' },
      ],
    },
  },
  stats: {
    label: 'Stats Counter',
    icon: FiGrid,
    defaultProps: {
      stats: [
        { value: '10K+', label: 'Active Users', icon: '👥' },
        { value: '99.9%', label: 'Uptime', icon: '⚡' },
        { value: '150+', label: 'Countries', icon: '🌍' },
        { value: '24/7', label: 'Support', icon: '💬' },
      ],
      style: 'cards',
    },
  },
  timeline: {
    label: 'Timeline',
    icon: FiMinus,
    defaultProps: {
      items: [
        { date: '2024', title: 'Company Founded', description: 'Started with a vision to change the world.' },
        { date: '2024', title: 'First Product Launch', description: 'Released our flagship product to market.' },
        { date: '2025', title: 'Series A Funding', description: 'Raised $10M to accelerate growth.' },
      ],
      style: 'alternating',
    },
  },
  accordion: {
    label: 'FAQ Accordion',
    icon: FiChevronRight,
    defaultProps: {
      items: [
        { question: 'What is your refund policy?', answer: 'We offer a 30-day money-back guarantee on all plans.' },
        { question: 'How do I get started?', answer: 'Simply sign up for a free account and follow our onboarding guide.' },
        { question: 'Do you offer custom plans?', answer: 'Yes! Contact our sales team for enterprise pricing.' },
      ],
      allowMultiple: false,
    },
  },
  tabs: {
    label: 'Content Tabs',
    icon: FiGrid,
    defaultProps: {
      tabs: [
        { label: 'Features', content: 'Discover all the amazing features our platform offers.' },
        { label: 'Benefits', content: 'Learn how our solution can help your business grow.' },
        { label: 'Pricing', content: 'Flexible pricing plans for teams of all sizes.' },
      ],
      style: 'pills',
    },
  },
  imageText: {
    label: 'Image + Text',
    icon: FiImage,
    defaultProps: {
      image: 'https://picsum.photos/600/400',
      title: 'Feature Highlight',
      description: 'Describe your amazing feature here with compelling copy that converts visitors into customers.',
      buttonText: 'Learn More',
      buttonUrl: '#',
      imagePosition: 'left',
      style: 'rounded',
    },
  },
  logoCloud: {
    label: 'Logo Cloud',
    icon: FiGrid,
    defaultProps: {
      title: 'Trusted by Industry Leaders',
      logos: [
        { name: 'Company 1', url: 'https://via.placeholder.com/120x40?text=Logo+1' },
        { name: 'Company 2', url: 'https://via.placeholder.com/120x40?text=Logo+2' },
        { name: 'Company 3', url: 'https://via.placeholder.com/120x40?text=Logo+3' },
        { name: 'Company 4', url: 'https://via.placeholder.com/120x40?text=Logo+4' },
        { name: 'Company 5', url: 'https://via.placeholder.com/120x40?text=Logo+5' },
      ],
      style: 'grayscale',
    },
  },
  newsletter: {
    label: 'Newsletter',
    icon: FiMessageSquare,
    defaultProps: {
      title: 'Stay Updated',
      description: 'Subscribe to our newsletter for the latest news and updates.',
      buttonText: 'Subscribe',
      placeholder: 'Enter your email',
      style: 'inline',
    },
  },
  socialProof: {
    label: 'Social Proof',
    icon: FiStar,
    defaultProps: {
      type: 'reviews',
      rating: 4.9,
      reviewCount: 2847,
      avatars: [
        'https://i.pravatar.cc/40?img=1',
        'https://i.pravatar.cc/40?img=2',
        'https://i.pravatar.cc/40?img=3',
        'https://i.pravatar.cc/40?img=4',
      ],
      text: 'Join 10,000+ happy customers',
    },
  },
  countdown: {
    label: 'Countdown Timer',
    icon: FiGrid,
    defaultProps: {
      title: 'Launch Coming Soon',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      style: 'cards',
      showLabels: true,
    },
  },
  row: {
    label: 'Row / Columns',
    icon: FiGrid,
    defaultProps: {
      columns: [
        { id: 'col-1', width: { desktop: 6, tablet: 6, mobile: 12 }, blocks: [] },
        { id: 'col-2', width: { desktop: 6, tablet: 6, mobile: 12 }, blocks: [] },
      ],
      gap: 24,
      verticalAlign: 'top',
      horizontalAlign: 'left',
    } as RowSettings,
  },
  header: {
    label: 'Header',
    icon: FiGrid,
    defaultProps: {
      logo: { url: '', width: 120, position: 'left' },
      style: 'default',
      backgroundColor: '',
      navItems: [
        { id: '1', label: 'Home', link: { type: 'internal', url: '/' }, children: [] },
        { id: '2', label: 'About', link: { type: 'internal', url: '/about' }, children: [] },
        { id: '3', label: 'Services', link: { type: 'internal', url: '/services' }, children: [] },
        { id: '4', label: 'Contact', link: { type: 'internal', url: '/contact' }, children: [] },
      ],
      showTopBar: false,
      topBar: { phone: '+1 (555) 123-4567', email: 'hello@example.com', socialLinks: [] },
      ctaButton: { show: true, text: 'Get Started', link: { type: 'internal', url: '/signup' }, style: 'solid' },
      mobileBreakpoint: 'md',
    } as HeaderSettings,
  },
  productCard: {
    label: 'Product Card',
    icon: FiGrid,
    defaultProps: {
      product: {
        id: '1',
        image: 'https://picsum.photos/400/400',
        title: 'Premium Product',
        price: 99.99,
        salePrice: 79.99,
        rating: 4.5,
        reviewCount: 128,
        badge: 'Sale',
        inStock: true,
        productUrl: '/products/premium-product',
        quickViewEnabled: true,
      } as ProductData,
      showRating: true,
      showBadge: true,
      buttonStyle: 'solid',
    },
  },
  productGrid: {
    label: 'Product Grid',
    icon: FiGrid,
    defaultProps: {
      products: [
        { id: '1', image: 'https://picsum.photos/400/400?1', title: 'Product One', price: 49.99, rating: 4.5, reviewCount: 42, inStock: true, productUrl: '/products/product-one', quickViewEnabled: true },
        { id: '2', image: 'https://picsum.photos/400/400?2', title: 'Product Two', price: 79.99, salePrice: 59.99, rating: 5, reviewCount: 128, badge: 'Sale', inStock: true, productUrl: '/products/product-two', quickViewEnabled: true },
        { id: '3', image: 'https://picsum.photos/400/400?3', title: 'Product Three', price: 29.99, rating: 4, reviewCount: 18, inStock: true, productUrl: '/products/product-three', quickViewEnabled: true },
        { id: '4', image: 'https://picsum.photos/400/400?4', title: 'Product Four', price: 149.99, rating: 4.8, reviewCount: 256, badge: 'Best Seller', inStock: true, productUrl: '/products/product-four', quickViewEnabled: true },
      ] as ProductData[],
      columns: 4,
      showRating: true,
      buttonStyle: 'solid',
    },
  },
  featuredProduct: {
    label: 'Featured Product',
    icon: FiGrid,
    defaultProps: {
      product: {
        id: '1',
        image: 'https://picsum.photos/800/600',
        title: 'Featured Product Hero',
        description: 'This is our most popular product with amazing features and quality.',
        price: 199.99,
        salePrice: 149.99,
        rating: 5,
        reviewCount: 512,
        badge: 'Featured',
        inStock: true,
        productUrl: '/products/featured-product',
        quickViewEnabled: true,
      } as ProductData,
      layout: 'left',
    },
  },
  productCarousel: {
    label: 'Product Carousel',
    icon: FiGrid,
    defaultProps: {
      products: [
        { id: '1', image: 'https://picsum.photos/400/400?5', title: 'Carousel Item 1', price: 59.99, rating: 4.5, reviewCount: 32, inStock: true, productUrl: '/products/carousel-1', quickViewEnabled: true },
        { id: '2', image: 'https://picsum.photos/400/400?6', title: 'Carousel Item 2', price: 89.99, rating: 4.8, reviewCount: 64, inStock: true, productUrl: '/products/carousel-2', quickViewEnabled: true },
        { id: '3', image: 'https://picsum.photos/400/400?7', title: 'Carousel Item 3', price: 39.99, rating: 4.2, reviewCount: 21, inStock: true, productUrl: '/products/carousel-3', quickViewEnabled: true },
      ] as ProductData[],
      autoPlay: false,
      showArrows: true,
    },
  },
  // ============ Course/LMS Blocks ============
  courseCard: {
    label: 'Course Card',
    icon: FiBook,
    defaultProps: {
      course: {
        id: '1',
        title: 'Complete Web Development Bootcamp',
        description: 'Learn HTML, CSS, JavaScript, React, Node.js and more in this comprehensive course.',
        image: 'https://picsum.photos/600/400?course1',
        instructor: 'John Doe',
        instructorImage: 'https://i.pravatar.cc/150?u=instructor1',
        duration: '42 hours',
        lessonCount: 156,
        price: 99.99,
        salePrice: 49.99,
        rating: 4.8,
        reviewCount: 2450,
        enrollmentCount: 15000,
        level: 'beginner' as const,
        category: 'Web Development',
        courseUrl: '/courses/web-development-bootcamp',
      } as CourseData,
      showInstructor: true,
      showPrice: true,
      showRating: true,
    },
  },
  courseGrid: {
    label: 'Course Grid',
    icon: FiGrid,
    defaultProps: {
      courses: [
        { id: '1', title: 'Web Development Bootcamp', image: 'https://picsum.photos/600/400?c1', instructor: 'John Doe', instructorImage: 'https://i.pravatar.cc/150?u=i1', duration: '42h', lessonCount: 156, price: 99.99, salePrice: 49.99, rating: 4.8, reviewCount: 2450, enrollmentCount: 15000, level: 'beginner' as const, courseUrl: '/courses/1' },
        { id: '2', title: 'React Masterclass', image: 'https://picsum.photos/600/400?c2', instructor: 'Jane Smith', instructorImage: 'https://i.pravatar.cc/150?u=i2', duration: '28h', lessonCount: 98, price: 79.99, rating: 4.9, reviewCount: 1820, enrollmentCount: 8500, level: 'intermediate' as const, courseUrl: '/courses/2' },
        { id: '3', title: 'Node.js Backend', image: 'https://picsum.photos/600/400?c3', instructor: 'Mike Johnson', instructorImage: 'https://i.pravatar.cc/150?u=i3', duration: '35h', lessonCount: 120, price: 89.99, rating: 4.7, reviewCount: 980, enrollmentCount: 5200, level: 'intermediate' as const, courseUrl: '/courses/3' },
      ] as CourseData[],
      columns: 3,
      showFilters: false,
    },
  },
  courseCurriculum: {
    label: 'Course Curriculum',
    icon: FiList,
    defaultProps: {
      modules: [
        { id: '1', title: 'Getting Started', duration: '30:00', lessons: [
          { id: '1-1', title: 'Welcome to the Course', type: 'video' as const, duration: '5:00', isFree: true },
          { id: '1-2', title: 'Course Overview', type: 'video' as const, duration: '10:00', isFree: true },
          { id: '1-3', title: 'Setting Up Your Environment', type: 'video' as const, duration: '15:00' },
        ]},
        { id: '2', title: 'Core Concepts', duration: '55:00', lessons: [
          { id: '2-1', title: 'Understanding the Basics', type: 'video' as const, duration: '20:00' },
          { id: '2-2', title: 'Hands-on Practice', type: 'video' as const, duration: '25:00' },
          { id: '2-3', title: 'Module Quiz', type: 'quiz' as const, duration: '10:00' },
        ]},
      ] as ModuleData[],
      showDuration: true,
      showLessonCount: true,
      expandedByDefault: false,
    },
  },
  courseProgress: {
    label: 'Course Progress',
    icon: FiTrendingUp,
    defaultProps: {
      progress: {
        courseId: '1',
        courseTitle: 'Complete Web Development Bootcamp',
        courseImage: 'https://picsum.photos/600/400?progress',
        progress: 65,
        completedLessons: 101,
        totalLessons: 156,
        lastAccessedLesson: 'Building REST APIs',
      } as CourseProgressData,
      showContinueButton: true,
    },
  },
  courseInstructor: {
    label: 'Course Instructor',
    icon: FiUser,
    defaultProps: {
      instructor: {
        id: '1',
        name: 'Dr. Sarah Johnson',
        photo: 'https://i.pravatar.cc/300?u=instructor',
        title: 'Senior Software Engineer & Educator',
        bio: 'With over 15 years of experience in software development and 8 years of teaching, I\'ve helped over 100,000 students master programming.',
        rating: 4.9,
        reviewCount: 12500,
        courseCount: 12,
        studentCount: 150000,
        credentials: ['PhD Computer Science', 'AWS Certified', 'Google Developer Expert'],
        socialLinks: [
          { platform: 'twitter', url: 'https://twitter.com/sarahjohnson' },
          { platform: 'linkedin', url: 'https://linkedin.com/in/sarahjohnson' },
          { platform: 'youtube', url: 'https://youtube.com/@sarahjohnson' },
        ],
      } as InstructorData,
      showStats: true,
      showSocial: true,
    },
  },
  courseCategories: {
    label: 'Course Categories',
    icon: FiFolder,
    defaultProps: {
      categories: [
        { id: '1', name: 'Web Development', slug: 'web-dev', icon: '💻', courseCount: 245, color: '#3B82F6' },
        { id: '2', name: 'Mobile Development', slug: 'mobile', icon: '📱', courseCount: 128, color: '#10B981' },
        { id: '3', name: 'Data Science', slug: 'data-science', icon: '📊', courseCount: 89, color: '#8B5CF6' },
        { id: '4', name: 'Design', slug: 'design', icon: '🎨', courseCount: 156, color: '#F59E0B' },
      ] as CourseCategoryData[],
      columns: 4,
      style: 'cards',
    },
  },
  // ============ Shop/E-commerce Blocks ============
  shoppingCart: {
    label: 'Shopping Cart',
    icon: FiShoppingCart,
    defaultProps: {
      cart: {
        items: [
          { id: '1', productId: 'p1', title: 'Wireless Headphones', image: 'https://picsum.photos/200/200?cart1', price: 149.99, quantity: 1, variant: 'Black' },
          { id: '2', productId: 'p2', title: 'Smart Watch', image: 'https://picsum.photos/200/200?cart2', price: 299.99, quantity: 2, variant: 'Silver' },
        ],
        subtotal: 749.97,
        tax: 67.50,
        shipping: 0,
        discount: 50,
        total: 767.47,
        currency: '$',
      } as CartData,
      style: 'full',
      showCheckoutButton: true,
    },
  },
  productCategories: {
    label: 'Product Categories',
    icon: FiFolder,
    defaultProps: {
      categories: [
        { id: '1', name: 'Electronics', slug: 'electronics', image: 'https://picsum.photos/400/400?cat1', productCount: 156 },
        { id: '2', name: 'Clothing', slug: 'clothing', image: 'https://picsum.photos/400/400?cat2', productCount: 324 },
        { id: '3', name: 'Home & Garden', slug: 'home-garden', image: 'https://picsum.photos/400/400?cat3', productCount: 89 },
        { id: '4', name: 'Sports', slug: 'sports', image: 'https://picsum.photos/400/400?cat4', productCount: 112 },
      ] as ProductCategory[],
      columns: 4,
      style: 'overlay',
    },
  },
  productFilter: {
    label: 'Product Filter',
    icon: FiFilter,
    defaultProps: {
      showPriceRange: true,
      showCategories: true,
      showRating: true,
      showSort: true,
      categories: ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books'],
      priceMin: 0,
      priceMax: 500,
    },
  },
  checkoutSummary: {
    label: 'Checkout Summary',
    icon: FiCreditCard,
    defaultProps: {
      cart: {
        items: [
          { id: '1', productId: 'p1', title: 'Premium Headphones', image: 'https://picsum.photos/200/200?checkout1', price: 199.99, quantity: 1 },
          { id: '2', productId: 'p2', title: 'Laptop Stand', image: 'https://picsum.photos/200/200?checkout2', price: 79.99, quantity: 1 },
        ],
        subtotal: 279.98,
        tax: 25.20,
        shipping: 0,
        discount: 20,
        total: 285.18,
        currency: '$',
      } as CartData,
      showItems: true,
      showCoupon: true,
    },
  },
  saleBanner: {
    label: 'Sale Banner',
    icon: FiPercent,
    defaultProps: {
      title: '🔥 Black Friday Sale!',
      subtitle: 'Up to 70% off on all products',
      discountCode: 'BLACKFRIDAY',
      discountText: 'SAVE 50%',
      ctaText: 'Shop Now',
      ctaUrl: '/sale',
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      style: 'full',
      backgroundColor: '#DC2626',
    },
  },
};

// ============ Theme Page Structure ============
export interface ThemePage {
  id: string;
  name: string;
  slug: string;
  blocks: ContentBlock[];
  isHomePage?: boolean;
}

// ============ Page Template Presets ============
export interface PageTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  blocks: { type: BlockType; props?: Record<string, any> }[];
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with an empty page',
    icon: '📄',
    blocks: [],
  },
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Hero, features, testimonials, and CTA',
    icon: '🚀',
    blocks: [
      { type: 'hero', props: { title: 'Welcome to Our Platform', subtitle: 'Build something amazing with our tools', buttonText: 'Get Started', buttonLink: '#', imageUrl: 'https://picsum.photos/1200/600', style: 'centered' } },
      { type: 'features', props: { title: 'Why Choose Us', columns: 3, features: [
        { icon: '⚡', title: 'Lightning Fast', description: 'Optimized for speed and performance' },
        { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security built in' },
        { icon: '🎨', title: 'Customizable', description: 'Fully customizable to your brand' },
        { icon: '📱', title: 'Responsive', description: 'Works perfectly on all devices' },
        { icon: '💬', title: '24/7 Support', description: 'We\'re here whenever you need us' },
        { icon: '📈', title: 'Analytics', description: 'Deep insights into your performance' },
      ]}},
      { type: 'testimonial', props: { quote: 'This platform transformed our business. The results have been incredible!', author: 'Sarah Johnson', role: 'CEO, TechCorp', avatar: 'https://i.pravatar.cc/100?1', style: 'card' } },
      { type: 'stats', props: { stats: [
        { value: '10K+', label: 'Happy Users' },
        { value: '99.9%', label: 'Uptime' },
        { value: '24/7', label: 'Support' },
        { value: '50+', label: 'Countries' },
      ], style: 'cards' }},
      { type: 'cta', props: { title: 'Ready to Get Started?', description: 'Join thousands of satisfied customers today.', buttonText: 'Start Free Trial', buttonLink: '#', style: 'gradient' } },
    ],
  },
  {
    id: 'about',
    name: 'About Page',
    description: 'Company story, team, and stats',
    icon: '👥',
    blocks: [
      { type: 'hero', props: { title: 'About Us', subtitle: 'Our story, our mission, our team', buttonText: '', imageUrl: 'https://picsum.photos/1200/500', style: 'minimal' } },
      { type: 'imageText', props: { title: 'Our Story', text: 'Founded in 2020, we set out to revolutionize the way businesses build their online presence. What started as a small team with a big vision has grown into a platform trusted by thousands of businesses worldwide.', imageUrl: 'https://picsum.photos/600/400?1', imagePosition: 'left' } },
      { type: 'imageText', props: { title: 'Our Mission', text: 'We believe everyone deserves the tools to build something great. Our mission is to democratize web development and make professional-grade tools accessible to all.', imageUrl: 'https://picsum.photos/600/400?2', imagePosition: 'right' } },
      { type: 'stats', props: { stats: [
        { value: '50+', label: 'Team Members' },
        { value: '2020', label: 'Founded' },
        { value: '10K+', label: 'Customers' },
        { value: '25', label: 'Countries' },
      ], style: 'minimal' }},
      { type: 'cta', props: { title: 'Want to Join Our Team?', description: 'We\'re always looking for talented people.', buttonText: 'View Careers', buttonLink: '#', style: 'simple' } },
    ],
  },
  {
    id: 'product',
    name: 'Product Page',
    description: 'Featured product showcase with grid',
    icon: '🛍️',
    blocks: [
      { type: 'featuredProduct', props: { product: { id: '1', image: 'https://picsum.photos/800/600', title: 'Premium Product Bundle', price: 299.99, salePrice: 199.99, rating: 4.9, reviewCount: 512, badge: 'Best Value', description: 'Everything you need in one complete package. Limited time offer!', inStock: true }, layout: 'horizontal', showBadge: true } },
      { type: 'divider', props: { style: 'line' } },
      { type: 'productGrid', props: { products: [
        { id: '1', image: 'https://picsum.photos/400/400?10', title: 'Essential Kit', price: 49.99, rating: 4.5, reviewCount: 128, inStock: true },
        { id: '2', image: 'https://picsum.photos/400/400?11', title: 'Pro Bundle', price: 99.99, salePrice: 79.99, rating: 4.8, reviewCount: 256, badge: 'Sale', inStock: true },
        { id: '3', image: 'https://picsum.photos/400/400?12', title: 'Starter Pack', price: 29.99, rating: 4.2, reviewCount: 64, inStock: true },
        { id: '4', image: 'https://picsum.photos/400/400?13', title: 'Ultimate Edition', price: 199.99, rating: 5.0, reviewCount: 89, badge: 'New', inStock: true },
      ], columns: 4, showRating: true }},
      { type: 'testimonial', props: { quote: 'The quality is outstanding. Best purchase I\'ve made this year!', author: 'Mike Chen', role: 'Verified Buyer', avatar: 'https://i.pravatar.cc/100?3', style: 'centered' } },
      { type: 'cta', props: { title: 'Free Shipping on Orders Over $100', description: 'Plus easy returns within 30 days.', buttonText: 'Shop Now', buttonLink: '#', style: 'gradient' } },
    ],
  },
  {
    id: 'blog',
    name: 'Blog Layout',
    description: 'Content-focused blog with sidebar',
    icon: '📝',
    blocks: [
      { type: 'hero', props: { title: 'Our Blog', subtitle: 'Insights, tips, and stories from our team', buttonText: '', imageUrl: '', style: 'minimal' } },
      { type: 'card', props: { image: 'https://picsum.photos/800/400?20', title: 'Getting Started with Our Platform', description: 'A comprehensive guide to help you hit the ground running with all the tools and features available.', buttonText: 'Read More', buttonLink: '#' } },
      { type: 'card', props: { image: 'https://picsum.photos/800/400?21', title: '10 Tips for Better Productivity', description: 'Discover the secrets to maximizing your workflow and getting more done in less time.', buttonText: 'Read More', buttonLink: '#' } },
      { type: 'card', props: { image: 'https://picsum.photos/800/400?22', title: 'The Future of Web Development', description: 'Explore the trends and technologies shaping the future of how we build for the web.', buttonText: 'Read More', buttonLink: '#' } },
      { type: 'newsletter', props: { title: 'Subscribe to Our Newsletter', description: 'Get the latest articles and updates delivered to your inbox.', buttonText: 'Subscribe', placeholder: 'Enter your email', style: 'inline' } },
    ],
  },
  {
    id: 'pricing',
    name: 'Pricing Page',
    description: 'Pricing tiers with comparison',
    icon: '💰',
    blocks: [
      { type: 'hero', props: { title: 'Simple, Transparent Pricing', subtitle: 'Choose the plan that works for you', buttonText: '', imageUrl: '', style: 'minimal' } },
      { type: 'pricing', props: { plans: [
        { name: 'Starter', price: 0, period: 'forever', features: ['5 Projects', '10GB Storage', 'Community Support', 'Basic Analytics'], buttonText: 'Get Started', popular: false },
        { name: 'Pro', price: 29, period: 'month', features: ['Unlimited Projects', '100GB Storage', 'Priority Support', 'Advanced Analytics', 'Custom Domain', 'API Access'], buttonText: 'Start Free Trial', popular: true },
        { name: 'Enterprise', price: 99, period: 'month', features: ['Everything in Pro', 'Unlimited Storage', 'Dedicated Support', 'Custom Integrations', 'SLA', 'On-premise Option'], buttonText: 'Contact Sales', popular: false },
      ]}},
      { type: 'accordion', props: { title: 'Frequently Asked Questions', items: [
        { question: 'Can I change plans later?', answer: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.' },
        { question: 'Is there a free trial?', answer: 'Yes! The Pro plan includes a 14-day free trial. No credit card required.' },
        { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, and bank transfers for annual plans.' },
        { question: 'Can I cancel anytime?', answer: 'Absolutely. Cancel anytime with no questions asked. We\'ll even prorate your refund.' },
      ]}},
      { type: 'cta', props: { title: 'Still Have Questions?', description: 'Our team is here to help you find the perfect plan.', buttonText: 'Contact Us', buttonLink: '#', style: 'simple' } },
    ],
  },
];

// ============ Block Components ============

// Animated Waveform Component for Audio Player
function AudioPlayerWaveform({ isPlaying, color = '#A78BFA' }: { isPlaying: boolean; color?: string }) {
  const bars = 32;
  return (
    <div className="flex items-end justify-center gap-[2px] h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const baseHeight = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 20;
        return (
          <div
            key={i}
            className="w-1 rounded-full transition-all duration-150"
            style={{
              height: `${baseHeight}%`,
              background: `linear-gradient(to top, ${color}, ${color}88)`,
              animation: isPlaying ? `audioWave ${0.5 + Math.random() * 0.5}s ease-in-out infinite alternate` : 'none',
              animationDelay: `${i * 0.02}s`,
              opacity: isPlaying ? 1 : 0.5,
            }}
          />
        );
      })}
      <style>{`
        @keyframes audioWave {
          0% { transform: scaleY(0.5); }
          100% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}

// Circular Progress Ring for Audio Player
function AudioProgressRing({ progress, size = 128, strokeWidth = 3, color = '#A78BFA' }: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth={strokeWidth}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-100"
      />
    </svg>
  );
}

// Audio Player Block - Modern design with vinyl disc and waveform
export function AudioPlayerBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
    setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !hasAudio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * audioRef.current.duration;
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const hasAudio = props.audioUrl && props.audioUrl.length > 0;

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ borderRadius: settings.borders.radius }}>
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.15),transparent)]" />

      {/* Floating Orbs */}
      <div className="absolute top-4 left-4 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-8 right-8 w-32 h-32 bg-pink-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Hidden Audio Element */}
      {hasAudio && (
        <audio
          ref={audioRef}
          src={props.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          loop={props.loop}
        />
      )}

      <div className="relative p-6">
        {/* Track Info */}
        <div className="text-center mb-4">
          <h4 className="text-lg font-semibold text-white truncate">
            {props.title || 'No Track Selected'}
          </h4>
          <p className="text-sm text-white/60 truncate">
            {props.artist || 'Unknown Artist'}
          </p>
          {props.album && (
            <p className="text-xs text-white/40 truncate mt-1">{props.album}</p>
          )}
        </div>

        {/* Vinyl Disc / Album Art */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className={`w-32 h-32 rounded-full shadow-2xl flex items-center justify-center ${isPlaying ? 'animate-spin' : ''}`}
              style={{
                animationDuration: '3s',
                background: props.albumArt
                  ? `url(${props.albumArt}) center/cover`
                  : 'linear-gradient(135deg, #1f2937, #111827)'
              }}
            >
              {!props.albumArt && (
                <>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-700 to-gray-800" />
                  {/* Vinyl grooves */}
                  <div className="absolute inset-6 rounded-full border border-gray-600/30" />
                  <div className="absolute inset-10 rounded-full border border-gray-600/20" />
                  <div className="absolute inset-14 rounded-full border border-gray-600/10" />
                  <div className="w-8 h-8 rounded-full bg-gray-900 z-10" />
                </>
              )}
              {/* Progress Ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <AudioProgressRing progress={progress} size={128} strokeWidth={3} color="#A78BFA" />
              </div>
            </div>
            {/* Shine effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Waveform Visualization */}
        <AudioPlayerWaveform isPlaying={isPlaying} color="#A78BFA" />

        {/* Progress Bar */}
        <div
          className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Time Display */}
        <div className="flex justify-between text-xs text-white/60 mt-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={togglePlay}
            disabled={!hasAudio}
            className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all hover:scale-110 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlaying ? (
              <FiPause size={24} className="text-white" />
            ) : (
              <FiPlay size={24} className="text-white ml-1" />
            )}
          </button>
        </div>

        {/* Volume */}
        <div className="flex items-center justify-center gap-2 mt-4">
          <FiVolume2 size={16} className="text-white/60" />
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            className="w-24 h-1 rounded-full appearance-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.3)' }}
          />
        </div>

        {/* No audio message */}
        {!hasAudio && (
          <div className="mt-4 text-center">
            <p className="text-white/50 text-sm">No audio file selected</p>
            <p className="text-white/30 text-xs mt-1">Click to edit and select an audio file</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Video Player Block
export function VideoPlayerBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(props.muted || false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hasVideo = props.videoUrl && props.videoUrl.length > 0;

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!videoRef.current || !hasVideo) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !hasVideo) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = percent * videoRef.current.duration;
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement?.parentElement;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className="relative rounded-xl overflow-hidden group bg-black"
      style={{ borderRadius: settings.borders.radius }}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Actual Video Element */}
      {hasVideo ? (
        <video
          ref={videoRef}
          src={props.videoUrl}
          poster={props.posterUrl}
          className="w-full aspect-video object-contain bg-black"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          loop={props.loop}
          muted={isMuted}
          playsInline={props.playsInline}
          onClick={togglePlay}
        />
      ) : (
        /* Placeholder when no video */
        <div
          className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center"
          style={{ backgroundImage: props.posterUrl ? `url(${props.posterUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-4">
            <FiPlay className="text-white ml-1" size={32} />
          </div>
          <p className="text-white/60 text-sm">No video selected</p>
        </div>
      )}

      {/* Play Button Overlay (when paused) */}
      {hasVideo && !isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer transition-opacity"
          onClick={togglePlay}
        >
          <button
            className="w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-2xl"
            style={{ background: settings.colors.primary }}
          >
            <FiPlay className="text-white ml-1" size={32} />
          </button>
        </div>
      )}

      {/* Controls Overlay */}
      {hasVideo && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.8))' }}
        >
          {/* Progress Bar */}
          <div className="mb-3">
            <div
              className="h-1.5 rounded-full overflow-hidden bg-white/30 cursor-pointer hover:h-2 transition-all"
              onClick={handleSeek}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progress}%`, background: settings.colors.primary }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={togglePlay}
                className="text-white hover:text-gray-200 transition-colors"
              >
                {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
              </button>

              {/* Volume Control */}
              <div className="flex items-center gap-2 group/volume">
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-gray-200 transition-colors"
                >
                  {isMuted || volume === 0 ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-0 group-hover/volume:w-20 transition-all duration-200 h-1 rounded-full appearance-none cursor-pointer opacity-0 group-hover/volume:opacity-100"
                  style={{ background: `linear-gradient(to right, white ${volume}%, rgba(255,255,255,0.3) ${volume}%)` }}
                />
              </div>

              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <FiMaximize size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Title */}
      {props.title && props.showTitle !== false && (
        <div
          className={`absolute top-0 left-0 right-0 p-4 transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'linear-gradient(rgba(0,0,0,0.6), transparent)' }}
        >
          <h4 className="text-white font-semibold">{props.title}</h4>
          {props.description && (
            <p className="text-white/70 text-sm mt-1">{props.description}</p>
          )}
        </div>
      )}
    </div>
  );
}

// Image Gallery Block
export function GalleryBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const { columns, images } = props;

  const gridColsMap: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };
  const gridCols = gridColsMap[columns as number] || 'grid-cols-3';

  return (
    <>
      <div className={`grid ${gridCols} gap-4`}>
        {images.map((img: { src: string; caption?: string }, i: number) => (
          <div
            key={i}
            className="relative group cursor-pointer overflow-hidden"
            style={{ borderRadius: settings.borders.radius }}
            onClick={() => setLightboxIndex(i)}
          >
            <img
              src={img.src}
              alt={img.caption || `Image ${i + 1}`}
              className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
              loading="lazy"
            />
            <div
              className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center"
            >
              <FiMaximize className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
            </div>
            {img.caption && (
              <div
                className="absolute bottom-0 left-0 right-0 p-2 text-sm text-white bg-black/50"
                style={{ fontFamily: settings.typography.bodyFont }}
              >
                {img.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setLightboxIndex(null)}
          >
            <FiX size={32} />
          </button>
          <button
            className="absolute left-4 text-white hover:text-gray-300"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(Math.max(0, lightboxIndex - 1)); }}
          >
            <FiChevronLeft size={48} />
          </button>
          <img
            src={images[lightboxIndex].src}
            alt={images[lightboxIndex].caption}
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            className="absolute right-4 text-white hover:text-gray-300"
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(Math.min(images.length - 1, lightboxIndex + 1)); }}
          >
            <FiChevronRight size={48} />
          </button>
        </div>
      )}
    </>
  );
}


// Button Block
export function ButtonBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { text, style, size, icon, iconPosition } = props;

  const sizeClassesMap: Record<string, string> = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-5 py-2.5 text-base',
    large: 'px-8 py-4 text-lg',
  };
  const sizeClasses = sizeClassesMap[size as string] || 'px-5 py-2.5 text-base';

  const getButtonStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      borderRadius: settings.borders.radius,
      fontFamily: settings.typography.bodyFont,
      fontWeight: 600,
      transition: 'all 0.2s ease',
    };

    switch (style) {
      case 'solid':
        return { ...base, background: settings.colors.primary, color: 'white' };
      case 'outline':
        return { ...base, background: 'transparent', color: settings.colors.primary, border: `2px solid ${settings.colors.primary}` };
      case 'gradient':
        return { ...base, background: `linear-gradient(135deg, ${settings.colors.primary}, ${settings.colors.secondary})`, color: 'white' };
      case 'ghost':
        return { ...base, background: 'transparent', color: settings.colors.primary };
      default:
        return { ...base, background: settings.colors.primary, color: 'white' };
    }
  };

  return (
    <button
      className={`inline-flex items-center gap-2 ${sizeClasses} hover:opacity-90 hover:scale-105 transition-all`}
      style={getButtonStyle()}
    >
      {icon && iconPosition === 'left' && <span>{icon}</span>}
      {text}
      {icon && iconPosition === 'right' && <span>{icon}</span>}
    </button>
  );
}

// Hero Section Block
export function HeroBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { title, subtitle, ctaText, ctaUrl, backgroundImage, overlay, alignment } = props;

  const alignmentClassesMap: Record<string, string> = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };
  const alignmentClasses = alignmentClassesMap[alignment as string] || 'text-center items-center';

  return (
    <div
      className="relative min-h-[400px] flex items-center justify-center overflow-hidden"
      style={{ borderRadius: settings.borders.radius }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      />

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: `rgba(0,0,0,${overlay})` }}
      />

      {/* Content */}
      <div className={`relative z-10 max-w-3xl mx-auto px-8 py-16 flex flex-col ${alignmentClasses}`}>
        <h1
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{
            color: 'white',
            fontFamily: settings.typography.headingFont,
            fontWeight: settings.typography.headingWeight,
          }}
        >
          {title}
        </h1>
        <p
          className="text-xl mb-8 opacity-90"
          style={{
            color: 'white',
            fontFamily: settings.typography.bodyFont,
          }}
        >
          {subtitle}
        </p>
        <a
          href={ctaUrl}
          className="inline-block px-8 py-4 font-semibold transition-transform hover:scale-105"
          style={{
            background: settings.colors.primary,
            color: 'white',
            borderRadius: settings.borders.radius,
          }}
        >
          {ctaText}
        </a>
      </div>
    </div>
  );
}

// Card Block
export function CardBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { image, title, description, buttonText, buttonUrl } = props;

  return (
    <div
      className="overflow-hidden transition-all hover:shadow-xl"
      style={{
        background: settings.colors.surface,
        border: `${settings.borders.width}px solid ${settings.colors.border}`,
        borderRadius: settings.borders.radius,
      }}
    >
      {image && (
        <div
          className="h-48 bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />
      )}
      <div style={{ padding: settings.spacing.sectionPadding }}>
        <h3
          className="text-xl font-semibold mb-2"
          style={{
            color: settings.colors.heading,
            fontFamily: settings.typography.headingFont,
          }}
        >
          {title}
        </h3>
        <p
          className="mb-4"
          style={{
            color: settings.colors.textMuted,
            fontFamily: settings.typography.bodyFont,
            lineHeight: settings.typography.lineHeight,
          }}
        >
          {description}
        </p>
        {buttonText && (
          <a
            href={buttonUrl}
            className="inline-block px-4 py-2 font-medium transition-colors hover:opacity-90"
            style={{
              background: settings.colors.primary,
              color: 'white',
              borderRadius: settings.borders.radius,
            }}
          >
            {buttonText}
          </a>
        )}
      </div>
    </div>
  );
}



// Testimonial Block
export function TestimonialBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { quote, author, role, avatar, rating } = props;

  return (
    <div
      className="p-8"
      style={{
        background: settings.colors.surface,
        border: `${settings.borders.width}px solid ${settings.colors.border}`,
        borderRadius: settings.borders.radius,
      }}
    >
      {/* Stars */}
      {rating > 0 && (
        <div className="flex gap-1 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <FiStar
              key={i}
              className={i < rating ? 'fill-current' : ''}
              style={{ color: i < rating ? '#fbbf24' : settings.colors.border }}
              size={20}
            />
          ))}
        </div>
      )}

      {/* Quote */}
      <blockquote
        className="text-lg italic mb-6"
        style={{
          color: settings.colors.text,
          fontFamily: settings.typography.bodyFont,
          lineHeight: settings.typography.lineHeight,
        }}
      >
        "{quote}"
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-4">
        <img
          src={avatar}
          alt={author}
          className="w-12 h-12 rounded-full object-cover"
        />
        <div>
          <div
            className="font-semibold"
            style={{
              color: settings.colors.heading,
              fontFamily: settings.typography.headingFont,
            }}
          >
            {author}
          </div>
          <div
            className="text-sm"
            style={{ color: settings.colors.textMuted }}
          >
            {role}
          </div>
        </div>
      </div>
    </div>
  );
}

// CTA Block
export function CTABlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { heading, description, buttonText, buttonUrl, backgroundType, backgroundColor } = props;

  const bgStyle = backgroundType === 'gradient'
    ? `linear-gradient(135deg, ${settings.colors.primary}, ${settings.colors.secondary})`
    : backgroundColor || settings.colors.primary;

  return (
    <div
      className="py-16 px-8 text-center"
      style={{
        background: bgStyle,
        borderRadius: settings.borders.radius,
      }}
    >
      <h2
        className="text-3xl font-bold mb-4"
        style={{
          color: 'white',
          fontFamily: settings.typography.headingFont,
          fontWeight: settings.typography.headingWeight,
        }}
      >
        {heading}
      </h2>
      <p
        className="text-lg mb-8 opacity-90 max-w-2xl mx-auto"
        style={{
          color: 'white',
          fontFamily: settings.typography.bodyFont,
        }}
      >
        {description}
      </p>
      <a
        href={buttonUrl}
        className="inline-block px-8 py-4 font-semibold transition-all hover:scale-105"
        style={{
          background: 'white',
          color: settings.colors.primary,
          borderRadius: settings.borders.radius,
        }}
      >
        {buttonText}
      </a>
    </div>
  );
}

// Features Grid Block
export function FeaturesBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { columns, features } = props;

  const gridColsMap: Record<number, string> = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  };
  const gridCols = gridColsMap[columns as number] || 'grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-8`}>
      {features.map((feature: { icon: string; title: string; description: string }, i: number) => (
        <div
          key={i}
          className="text-center p-6"
          style={{
            background: settings.colors.surface,
            border: `${settings.borders.width}px solid ${settings.colors.border}`,
            borderRadius: settings.borders.radius,
          }}
        >
          <div
            className="text-4xl mb-4"
            style={{ filter: 'grayscale(0)' }}
          >
            {feature.icon}
          </div>
          <h3
            className="text-lg font-semibold mb-2"
            style={{
              color: settings.colors.heading,
              fontFamily: settings.typography.headingFont,
            }}
          >
            {feature.title}
          </h3>
          <p
            className="text-sm"
            style={{
              color: settings.colors.textMuted,
              fontFamily: settings.typography.bodyFont,
            }}
          >
            {feature.description}
          </p>
        </div>
      ))}
    </div>
  );
}

// Divider Block
export function DividerBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { style, spacing, color } = props;

  const dividerColor = color || settings.colors.border;

  const getLineStyle = (): React.CSSProperties => {
    switch (style) {
      case 'dashed':
        return { borderTop: `2px dashed ${dividerColor}` };
      case 'dotted':
        return { borderTop: `2px dotted ${dividerColor}` };
      case 'gradient':
        return {
          height: 2,
          background: `linear-gradient(90deg, transparent, ${settings.colors.primary}, transparent)`,
        };
      default:
        return { borderTop: `1px solid ${dividerColor}` };
    }
  };

  return (
    <div style={{ padding: `${spacing}px 0` }}>
      <div style={getLineStyle()} />
    </div>
  );
}

// Pricing Table Block
export function PricingBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { plans } = props;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {plans.map((plan: any, i: number) => (
        <div
          key={i}
          className={`relative p-6 rounded-2xl transition-all duration-300 ${plan.highlighted ? 'scale-105 shadow-2xl z-10' : 'hover:shadow-xl'}`}
          style={{
            background: plan.highlighted ? `linear-gradient(135deg, ${settings.colors.primary}, ${settings.colors.secondary})` : settings.colors.surface,
            border: plan.highlighted ? 'none' : `${settings.borders.width}px solid ${settings.colors.border}`,
            borderRadius: settings.borders.radius * 1.5,
          }}
        >
          {plan.highlighted && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-gray-900 text-xs font-bold rounded-full shadow-lg">
              MOST POPULAR
            </div>
          )}
          <h3 style={{ color: plan.highlighted ? 'white' : settings.colors.heading, fontFamily: settings.typography.headingFont }} className="text-xl font-bold mb-2">{plan.name}</h3>
          <div className="flex items-baseline gap-1 mb-4">
            <span style={{ color: plan.highlighted ? 'white' : settings.colors.heading }} className="text-4xl font-bold">{plan.price}</span>
            <span style={{ color: plan.highlighted ? 'rgba(255,255,255,0.8)' : settings.colors.textMuted }} className="text-sm">{plan.period}</span>
          </div>
          <ul className="space-y-3 mb-6">
            {plan.features.map((f: string, j: number) => (
              <li key={j} className="flex items-center gap-2" style={{ color: plan.highlighted ? 'rgba(255,255,255,0.9)' : settings.colors.text }}>
                <span className="text-green-400">✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            className="w-full py-3 rounded-xl font-semibold transition-all"
            style={{
              background: plan.highlighted ? 'white' : settings.colors.primary,
              color: plan.highlighted ? settings.colors.primary : 'white',
              borderRadius: settings.borders.radius,
            }}
          >
            {plan.buttonText}
          </button>
        </div>
      ))}
    </div>
  );
}

// Stats Counter Block
export function StatsBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { stats, style } = props;

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-6`}>
      {stats.map((stat: any, i: number) => (
        <div
          key={i}
          className="text-center p-6 transition-all hover:scale-105"
          style={{
            background: style === 'cards' ? settings.colors.surface : 'transparent',
            border: style === 'cards' ? `${settings.borders.width}px solid ${settings.colors.border}` : 'none',
            borderRadius: settings.borders.radius,
          }}
        >
          <div className="text-4xl mb-2">{stat.icon}</div>
          <div style={{ color: settings.colors.primary, fontFamily: settings.typography.headingFont }} className="text-3xl font-bold mb-1">{stat.value}</div>
          <div style={{ color: settings.colors.textMuted }} className="text-sm">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

// Timeline Block
export function TimelineBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { items } = props;

  return (
    <div className="relative">
      <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-full" style={{ background: settings.colors.border }} />
      <div className="space-y-12">
        {items.map((item: any, i: number) => (
          <div key={i} className={`flex items-center gap-8 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
            <div className={`flex-1 ${i % 2 === 0 ? 'text-right' : 'text-left'}`}>
              <div style={{ color: settings.colors.primary }} className="text-sm font-semibold mb-1">{item.date}</div>
              <h4 style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }} className="text-lg font-bold mb-2">{item.title}</h4>
              <p style={{ color: settings.colors.textMuted }}>{item.description}</p>
            </div>
            <div className="relative z-10 w-4 h-4 rounded-full" style={{ background: settings.colors.primary, boxShadow: `0 0 0 4px ${settings.colors.background}` }} />
            <div className="flex-1" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Accordion Block
export function AccordionBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { items } = props;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {items.map((item: any, i: number) => (
        <div
          key={i}
          className="overflow-hidden transition-all"
          style={{
            background: settings.colors.surface,
            border: `${settings.borders.width}px solid ${settings.colors.border}`,
            borderRadius: settings.borders.radius,
          }}
        >
          <button
            className="w-full flex items-center justify-between p-4 text-left"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
          >
            <span style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }} className="font-semibold">{item.question}</span>
            <FiChevronRight className={`transition-transform ${openIndex === i ? 'rotate-90' : ''}`} style={{ color: settings.colors.primary }} />
          </button>
          {openIndex === i && (
            <div className="px-4 pb-4" style={{ color: settings.colors.textMuted }}>
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Tabs Block
export function TabsBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { tabs, style } = props;
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      <div className={`flex gap-2 mb-6 ${style === 'pills' ? '' : 'border-b border-gray-200'}`} style={{ borderColor: settings.colors.border }}>
        {tabs.map((tab: any, i: number) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 font-medium transition-all ${style === 'pills' ? 'rounded-full' : 'rounded-t-lg'}`}
            style={{
              background: activeTab === i ? settings.colors.primary : 'transparent',
              color: activeTab === i ? 'white' : settings.colors.textMuted,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        className="p-6"
        style={{
          background: settings.colors.surface,
          borderRadius: settings.borders.radius,
          color: settings.colors.text,
        }}
      >
        {tabs[activeTab]?.content}
      </div>
    </div>
  );
}

// Image + Text Block
export function ImageTextBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { image, title, description, buttonText, imagePosition } = props;

  return (
    <div className={`flex flex-col md:flex-row gap-8 items-center ${imagePosition === 'right' ? 'md:flex-row-reverse' : ''}`}>
      <div className="flex-1">
        <img
          src={image}
          alt={title}
          className="w-full h-64 object-cover shadow-xl"
          style={{ borderRadius: settings.borders.radius * 1.5 }}
        />
      </div>
      <div className="flex-1 space-y-4">
        <h3 style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }} className="text-2xl font-bold">{title}</h3>
        <p style={{ color: settings.colors.textMuted }} className="text-lg leading-relaxed">{description}</p>
        <button
          className="px-6 py-3 font-semibold transition-all hover:opacity-90"
          style={{ background: settings.colors.primary, color: 'white', borderRadius: settings.borders.radius }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

// Logo Cloud Block
export function LogoCloudBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { title, logos, style } = props;

  return (
    <div className="text-center">
      <p style={{ color: settings.colors.textMuted }} className="text-sm uppercase tracking-wider mb-8">{title}</p>
      <div className="flex flex-wrap items-center justify-center gap-8">
        {logos.map((logo: any, i: number) => (
          <img
            key={i}
            src={logo.url}
            alt={logo.name}
            className={`h-10 object-contain transition-all hover:opacity-100 ${style === 'grayscale' ? 'opacity-50 grayscale hover:grayscale-0' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

// Newsletter Block
export function NewsletterBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { title, description, buttonText, placeholder, style: layoutStyle } = props;

  return (
    <div
      className="p-8 text-center"
      style={{
        background: `linear-gradient(135deg, ${settings.colors.primary}15, ${settings.colors.secondary}15)`,
        borderRadius: settings.borders.radius * 2,
      }}
    >
      <h3 style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }} className="text-2xl font-bold mb-2">{title}</h3>
      <p style={{ color: settings.colors.textMuted }} className="mb-6">{description}</p>
      <div className={`flex gap-3 max-w-md mx-auto ${layoutStyle === 'stacked' ? 'flex-col' : ''}`}>
        <input
          type="email"
          placeholder={placeholder}
          className="flex-1 px-4 py-3 outline-none focus:ring-2"
          style={{
            background: settings.colors.surface,
            border: `${settings.borders.width}px solid ${settings.colors.border}`,
            borderRadius: settings.borders.radius,
            color: settings.colors.text,
          }}
        />
        <button
          className="px-6 py-3 font-semibold whitespace-nowrap transition-all hover:opacity-90"
          style={{ background: settings.colors.primary, color: 'white', borderRadius: settings.borders.radius }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}

// Social Proof Block
export function SocialProofBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { rating, reviewCount, avatars, text } = props;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 p-6" style={{ background: settings.colors.surface, borderRadius: settings.borders.radius }}>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <FiStar key={star} className={star <= Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} size={20} />
        ))}
        <span style={{ color: settings.colors.heading }} className="ml-2 font-bold">{rating}</span>
      </div>
      <div className="flex -space-x-2">
        {avatars.slice(0, 4).map((avatar: string, i: number) => (
          <img key={i} src={avatar} alt="" className="w-10 h-10 rounded-full border-2" style={{ borderColor: settings.colors.background }} />
        ))}
        {avatars.length > 4 && (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: settings.colors.primary, color: 'white' }}>
            +{avatars.length - 4}
          </div>
        )}
      </div>
      <div style={{ color: settings.colors.textMuted }}>
        <span style={{ color: settings.colors.heading }} className="font-semibold">{reviewCount.toLocaleString()}</span> reviews • {text}
      </div>
    </div>
  );
}

// Countdown Timer Block
export function CountdownBlock({
  props,
  settings
}: {
  props: Record<string, any>;
  settings: CustomThemeSettings;
}) {
  const { title, targetDate, showLabels } = props;
  const target = new Date(targetDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();

  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
  const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
  const seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

  const timeUnits = [
    { value: days, label: 'Days' },
    { value: hours, label: 'Hours' },
    { value: minutes, label: 'Minutes' },
    { value: seconds, label: 'Seconds' },
  ];

  return (
    <div className="text-center py-8">
      <h3 style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }} className="text-2xl font-bold mb-8">{title}</h3>
      <div className="flex justify-center gap-4">
        {timeUnits.map((unit, i) => (
          <div key={i} className="text-center">
            <div
              className="w-20 h-20 flex items-center justify-center text-3xl font-bold rounded-xl shadow-lg"
              style={{ background: settings.colors.surface, color: settings.colors.primary, borderRadius: settings.borders.radius }}
            >
              {String(unit.value).padStart(2, '0')}
            </div>
            {showLabels && (
              <div style={{ color: settings.colors.textMuted }} className="text-xs mt-2 uppercase tracking-wider">{unit.label}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ Block Renderer ============
export function BlockRenderer({
  block,
  settings,
  isSelected,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onCopy,
  onUpdateBlock,
  previewDevice = 'desktop',
}: {
  block: ContentBlock;
  settings: CustomThemeSettings;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDuplicate?: () => void;
  onCopy?: () => void;
  onUpdateBlock?: (block: ContentBlock) => void;
  onUpdateProps?: (props: Record<string, any>) => void;
  previewDevice?: 'desktop' | 'tablet' | 'mobile';
}) {
  // Check visibility based on device
  const isVisible = block.visibility ? block.visibility[previewDevice] : true;

  // Get animation class
  const getAnimationStyle = (): React.CSSProperties => {
    if (!block.animation || block.animation.type === 'none') return {};
    return {
      animationDuration: `${block.animation.duration}ms`,
      animationDelay: `${block.animation.delay}ms`,
      animationFillMode: 'both',
    };
  };

  const animationClass = block.animation?.type && block.animation.type !== 'none'
    ? `animate-${block.animation.type}`
    : '';

  if (!isVisible) {
    return (
      <div className="relative group opacity-30 border border-dashed border-gray-500 rounded p-2">
        <div className="text-xs text-gray-400 text-center">Hidden on {previewDevice}</div>
      </div>
    );
  }
  const renderBlock = () => {
    switch (block.type) {
      case 'audio':
        return <AudioPlayerBlock props={block.props} settings={settings} />;
      case 'video':
        return <VideoPlayerBlock props={block.props} settings={settings} />;
      case 'gallery':
        return <GalleryBlock props={block.props} settings={settings} />;
      case 'button':
        return <ButtonBlock props={block.props} settings={settings} />;
      case 'hero':
        return <HeroBlock props={block.props} settings={settings} />;
      case 'card':
        return <CardBlock props={block.props} settings={settings} />;
      case 'testimonial':
        return <TestimonialBlock props={block.props} settings={settings} />;
      case 'cta':
        return <CTABlock props={block.props} settings={settings} />;
      case 'features':
        return <FeaturesBlock props={block.props} settings={settings} />;
      case 'divider':
        return <DividerBlock props={block.props} settings={settings} />;
      case 'pricing':
        return <PricingBlock props={block.props} settings={settings} />;
      case 'stats':
        return <StatsBlock props={block.props} settings={settings} />;
      case 'timeline':
        return <TimelineBlock props={block.props} settings={settings} />;
      case 'accordion':
        return <AccordionBlock props={block.props} settings={settings} />;
      case 'tabs':
        return <TabsBlock props={block.props} settings={settings} />;
      case 'imageText':
        return <ImageTextBlock props={block.props} settings={settings} />;
      case 'logoCloud':
        return <LogoCloudBlock props={block.props} settings={settings} />;
      case 'newsletter':
        return <NewsletterBlock props={block.props} settings={settings} />;
      case 'socialProof':
        return <SocialProofBlock props={block.props} settings={settings} />;
      case 'countdown':
        return <CountdownBlock props={block.props} settings={settings} />;
      case 'row':
        return <RowBlock props={block.props as RowSettings} settings={settings} />;
      case 'header':
        return <HeaderBuilderBlock props={block.props as HeaderSettings} settings={settings} />;
      case 'productCard':
        return <ProductCardBlock props={block.props as { product: ProductData; showRating?: boolean; showBadge?: boolean; buttonStyle?: 'solid' | 'outline' | 'icon' }} settings={settings} />;
      case 'productGrid':
        return <ProductGridBlock props={block.props as { products: ProductData[]; columns: 2 | 3 | 4; showRating?: boolean; buttonStyle?: 'solid' | 'outline' | 'icon' }} settings={settings} />;
      case 'featuredProduct':
        return <FeaturedProductBlock props={block.props as { product: ProductData; layout: 'left' | 'right' }} settings={settings} />;
      case 'productCarousel':
        return <ProductCarouselBlock props={block.props as { products: ProductData[]; autoPlay?: boolean; showArrows?: boolean }} settings={settings} />;
      // Course/LMS Blocks
      case 'courseCard':
        return <CourseCardBlock props={block.props as { course: CourseData; showInstructor?: boolean; showPrice?: boolean; showRating?: boolean }} settings={settings} />;
      case 'courseGrid':
        return <CourseGridBlock props={block.props as { courses: CourseData[]; columns: 2 | 3 | 4; showFilters?: boolean }} settings={settings} />;
      case 'courseCurriculum':
        return <CourseCurriculumBlock props={block.props as { modules: ModuleData[]; showDuration?: boolean; showLessonCount?: boolean; expandedByDefault?: boolean }} settings={settings} />;
      case 'courseProgress':
        return <CourseProgressBlock props={block.props as { progress: CourseProgressData; showContinueButton?: boolean }} settings={settings} />;
      case 'courseInstructor':
        return <CourseInstructorBlock props={block.props as { instructor: InstructorData; showStats?: boolean; showSocial?: boolean }} settings={settings} />;
      case 'courseCategories':
        return <CourseCategoriesBlock props={block.props as { categories: CourseCategoryData[]; columns: 2 | 3 | 4 | 6; style: 'cards' | 'minimal' | 'icons' }} settings={settings} />;
      // Shop/E-commerce Blocks
      case 'shoppingCart':
        return <ShoppingCartBlock props={block.props as { cart: CartData; style: 'mini' | 'full' | 'sidebar'; showCheckoutButton?: boolean }} settings={settings} />;
      case 'productCategories':
        return <ProductCategoriesBlock props={block.props as { categories: ProductCategory[]; columns: 2 | 3 | 4 | 5; style: 'cards' | 'overlay' | 'minimal' }} settings={settings} />;
      case 'productFilter':
        return <ProductFilterBlock props={block.props as { showPriceRange?: boolean; showCategories?: boolean; showRating?: boolean; showSort?: boolean; categories?: string[]; priceMin?: number; priceMax?: number }} settings={settings} />;
      case 'checkoutSummary':
        return <CheckoutSummaryBlock props={block.props as { cart: CartData; showItems?: boolean; showCoupon?: boolean }} settings={settings} />;
      case 'saleBanner':
        return <SaleBannerBlock props={block.props as { title: string; subtitle?: string; discountCode?: string; discountText?: string; ctaText?: string; ctaUrl?: string; endDate?: string; style: 'full' | 'compact' | 'floating'; backgroundColor?: string }} settings={settings} />;
      default:
        return <div>Unknown block type: {block.type}</div>;
    }
  };

  return (
    <div
      className={`relative group ${isSelected ? 'ring-2 ring-blue-500' : ''} ${animationClass}`}
      style={getAnimationStyle()}
      onClick={onSelect}
    >
      {/* Block Controls */}
      <div className={`absolute -top-3 right-2 flex items-center gap-1 bg-gray-800 rounded-lg p-1 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-300"
          title="Move Up"
        >
          <FiArrowUp size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-300"
          title="Move Down"
        >
          <FiArrowDown size={14} />
        </button>
        <div className="w-px h-4 bg-gray-600" />
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate?.(); }}
          className="p-1.5 hover:bg-blue-600 rounded text-gray-300"
          title="Duplicate Block"
        >
          <FiCopy size={14} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onCopy?.(); }}
          className="p-1.5 hover:bg-green-600 rounded text-gray-300"
          title="Copy to Clipboard"
        >
          <FiMove size={14} />
        </button>
        <div className="w-px h-4 bg-gray-600" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onUpdateBlock) {
              const visibility = block.visibility || { desktop: true, tablet: true, mobile: true };
              onUpdateBlock({ ...block, visibility: { ...visibility, [previewDevice]: !visibility[previewDevice] } });
            }
          }}
          className="p-1.5 hover:bg-gray-700 rounded text-gray-300"
          title={`Toggle visibility on ${previewDevice}`}
        >
          {block.visibility?.[previewDevice] === false ? <FiEyeOff size={14} /> : <FiEye size={14} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
          className="p-1.5 hover:bg-red-600 rounded text-gray-300"
          title="Delete"
        >
          <FiTrash2 size={14} />
        </button>
      </div>

      {/* Block Type Label */}
      <div className={`absolute -top-3 left-2 px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300 z-10 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        {BLOCK_CONFIGS[block.type as BlockType]?.label || block.type}
      </div>

      {renderBlock()}
    </div>
  );
}

// ============ Content Blocks Panel (Sidebar) ============
export function ContentBlocksPanel({
  blocks,
  onAddBlock,
  onUpdateBlock,
  onUpdateFullBlock,
  onLoadTemplate,
  selectedBlockId,
  onSelectBlock,
}: {
  blocks: ContentBlock[];
  onAddBlock: (type: BlockType) => void;
  onRemoveBlock: (id: string) => void;
  onMoveBlock: (id: string, direction: 'up' | 'down') => void;
  onUpdateBlock: (id: string, props: Record<string, any>) => void;
  onUpdateFullBlock?: (block: ContentBlock) => void;
  onLoadTemplate?: (template: PageTemplate) => void;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
}) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);

  // Helper to update a full block (for link, visibility, animation)
  const handleUpdateFullBlock = (updatedBlock: ContentBlock) => {
    if (onUpdateFullBlock) {
      onUpdateFullBlock(updatedBlock);
    } else {
      // Fallback: use onUpdateBlock to update props, but we can't update link/visibility/animation this way
      onUpdateBlock(updatedBlock.id, updatedBlock.props);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="font-semibold text-white">Content Blocks</h3>
        <div className="flex items-center gap-2">
          {/* Template Selector Button */}
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium"
            title="Use a template"
          >
            📋
          </button>

          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
            >
              <FiPlus size={16} /> Add
            </button>

            {/* Add Block Menu */}
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-gray-800 border border-gray-700 rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
                {Object.entries(BLOCK_CONFIGS).map(([type, config]) => (
                  <button
                    key={type}
                    onClick={() => {
                      onAddBlock(type as BlockType);
                      setShowAddMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-700 text-left"
                  >
                    <config.icon size={18} className="text-gray-400" />
                    <span className="text-white">{config.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Selector Panel */}
      {showTemplates && (
        <div className="p-4 border-b border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-white">📋 Page Templates</h4>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-gray-400 hover:text-white"
            >
              <FiX size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-400 mb-3">
            {blocks.length > 0
              ? 'Warning: Loading a template will replace all current blocks.'
              : 'Choose a template to get started quickly.'}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PAGE_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  if (onLoadTemplate) {
                    onLoadTemplate(template);
                  }
                  setShowTemplates(false);
                }}
                className="flex flex-col items-center gap-2 p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-center transition-colors"
              >
                <span className="text-2xl">{template.icon}</span>
                <span className="text-xs font-medium text-white">{template.name}</span>
                <span className="text-[10px] text-gray-400 leading-tight">{template.description}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Block List */}
      <div className="flex-1 overflow-y-auto p-4">
        {blocks.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <FiGrid className="text-blue-400" size={28} />
            </div>
            <p className="text-gray-300 font-medium mb-1">Start Building</p>
            <p className="text-gray-500 text-xs mb-4">Add blocks or use a template</p>

            {/* Quick Template Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setShowTemplates(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                📋 Use a Template
              </button>
              <button
                onClick={() => setShowAddMenu(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors text-gray-300"
              >
                <FiPlus size={16} /> Add First Block
              </button>
            </div>

            {/* Template Preview */}
            <div className="mt-6 pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 mb-3">Popular Templates:</p>
              <div className="flex justify-center gap-2">
                {PAGE_TEMPLATES.slice(1, 4).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => onLoadTemplate?.(t)}
                    className="flex flex-col items-center gap-1 p-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg transition-colors"
                    title={t.description}
                  >
                    <span className="text-lg">{t.icon}</span>
                    <span className="text-[10px] text-gray-400">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {blocks.map((block, index) => {
              const config = BLOCK_CONFIGS[block.type];
              const Icon = config.icon;
              return (
                <div
                  key={block.id}
                  onClick={() => onSelectBlock(block.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedBlockId === block.id
                      ? 'bg-blue-600/20 border border-blue-500'
                      : 'bg-gray-700/50 hover:bg-gray-700 border border-transparent'
                  }`}
                >
                  <FiMove className="text-gray-500 cursor-grab" size={14} />
                  <Icon size={16} className="text-gray-400" />
                  <span className="flex-1 text-sm text-white">{config.label}</span>
                  <span className="text-xs text-gray-500">#{index + 1}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Block Settings Panel */}
      {selectedBlock && (
        <div className="border-t border-gray-700 p-4 max-h-[400px] overflow-y-auto">
          <h4 className="font-medium text-white mb-3">Block Settings</h4>
          <BlockSettingsForm
            block={selectedBlock}
            onUpdate={(props) => onUpdateBlock(selectedBlock.id, props)}
          />

          {/* Advanced Settings Accordion */}
          <div className="mt-4 space-y-3">
            {/* Link Settings */}
            <details className="group" open>
              <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-300 hover:text-white py-2 border-b border-gray-700">
                <span>🔗 Link Settings</span>
                <span className="text-xs text-blue-400">{selectedBlock.link?.type !== 'none' && selectedBlock.link?.type ? `(${selectedBlock.link.type})` : ''}</span>
              </summary>
              <div className="mt-2">
                <LinkSettingsForm
                  link={selectedBlock.link || { type: 'none', url: '' }}
                  onChange={(link) => {
                    handleUpdateFullBlock({ ...selectedBlock, link });
                  }}
                />
              </div>
            </details>

            {/* Visibility Settings */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-300 hover:text-white py-2 border-b border-gray-700">
                <span>👁️ Visibility</span>
                <span className="text-xs text-gray-500">
                  {selectedBlock.visibility ?
                    `${selectedBlock.visibility.desktop ? '🖥' : ''}${selectedBlock.visibility.tablet ? '📱' : ''}${selectedBlock.visibility.mobile ? '📲' : ''}`
                    : '🖥📱📲'}
                </span>
              </summary>
              <div className="mt-2">
                <VisibilitySettings
                  visibility={selectedBlock.visibility || { desktop: true, tablet: true, mobile: true }}
                  onChange={(visibility) => {
                    handleUpdateFullBlock({ ...selectedBlock, visibility });
                  }}
                />
              </div>
            </details>

            {/* Animation Settings */}
            <details className="group">
              <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-300 hover:text-white py-2 border-b border-gray-700">
                <span>✨ Animation</span>
                <span className="text-xs text-purple-400">{selectedBlock.animation?.type !== 'none' ? selectedBlock.animation?.type : ''}</span>
              </summary>
              <div className="mt-2">
                <AnimationSettingsForm
                  animation={selectedBlock.animation || { type: 'none', duration: 300, delay: 0 }}
                  onChange={(animation) => {
                    handleUpdateFullBlock({ ...selectedBlock, animation });
                  }}
                />
              </div>
            </details>

            {/* Row/Column Preset Layouts (only for row blocks) */}
            {selectedBlock.type === 'row' && (
              <details className="group" open>
                <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-300 hover:text-white py-2 border-b border-gray-700">
                  <span>📐 Column Presets</span>
                </summary>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {PRESET_LAYOUTS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        const newColumns = preset.columns.map((width, i) => ({
                          id: `col-${Date.now()}-${i}`,
                          width: { desktop: width as 1|2|3|4|5|6|7|8|9|10|11|12, tablet: Math.min(width * 2, 12) as 1|2|3|4|5|6|7|8|9|10|11|12, mobile: 12 as 1|2|3|4|5|6|7|8|9|10|11|12 },
                          blocks: [],
                        }));
                        handleUpdateFullBlock({
                          ...selectedBlock,
                          props: { ...selectedBlock.props, columns: newColumns }
                        });
                      }}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white text-center"
                    >
                      {preset.name}
                      <div className="flex gap-0.5 mt-1 justify-center">
                        {preset.columns.map((w, i) => (
                          <div key={i} className="h-2 bg-blue-500 rounded" style={{ width: `${(w / 12) * 100}%`, minWidth: 4 }} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============ Block Settings Form ============
function BlockSettingsForm({
  block,
  onUpdate,
}: {
  block: ContentBlock;
  onUpdate: (props: Record<string, any>) => void;
}) {
  const { type, props } = block;

  const updateProp = (key: string, value: any) => {
    onUpdate({ ...props, [key]: value });
  };

  // Common input component
  const TextInput = ({ label, propKey }: { label: string; propKey: string }) => (
    <div className="mb-3">
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type="text"
        value={props[propKey] || ''}
        onChange={(e) => updateProp(propKey, e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
      />
    </div>
  );

  const SelectInput = ({ label, propKey, options }: { label: string; propKey: string; options: { value: string; label: string }[] }) => (
    <div className="mb-3">
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <select
        value={props[propKey] || ''}
        onChange={(e) => updateProp(propKey, e.target.value)}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  const RangeInput = ({ label, propKey, min, max, step = 1 }: { label: string; propKey: string; min: number; max: number; step?: number }) => (
    <div className="mb-3">
      <label className="block text-xs text-gray-400 mb-1">{label}: {props[propKey]}</label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={props[propKey] || min}
        onChange={(e) => updateProp(propKey, Number(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );

  const NumberInput = ({ label, propKey }: { label: string; propKey: string }) => (
    <div className="mb-3">
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      <input
        type="number"
        value={props[propKey] || 0}
        onChange={(e) => updateProp(propKey, Number(e.target.value))}
        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
      />
    </div>
  );

  const CheckboxInput = ({ label, propKey }: { label: string; propKey: string }) => (
    <div className="mb-3 flex items-center gap-2">
      <input
        type="checkbox"
        checked={props[propKey] || false}
        onChange={(e) => updateProp(propKey, e.target.checked)}
        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
      />
      <label className="text-xs text-gray-400">{label}</label>
    </div>
  );

  switch (type) {
    case 'audio':
      return <AudioBlockSettings props={props} onUpdate={onUpdate} />;
    case 'video':
      return <VideoBlockSettings props={props} onUpdate={onUpdate} />;
    case 'gallery':
      return (
        <>
          <SelectInput
            label="Layout"
            propKey="layout"
            options={[
              { value: 'grid', label: 'Grid' },
              { value: 'masonry', label: 'Masonry' },
            ]}
          />
          <SelectInput
            label="Columns"
            propKey="columns"
            options={[
              { value: '2', label: '2 Columns' },
              { value: '3', label: '3 Columns' },
              { value: '4', label: '4 Columns' },
            ]}
          />
        </>
      );
    case 'button':
      return (
        <>
          <TextInput label="Button Text" propKey="text" />
          <SelectInput
            label="Style"
            propKey="style"
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'outline', label: 'Outline' },
              { value: 'gradient', label: 'Gradient' },
              { value: 'ghost', label: 'Ghost' },
            ]}
          />
          <SelectInput
            label="Size"
            propKey="size"
            options={[
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ]}
          />
        </>
      );
    case 'hero':
      return (
        <>
          <TextInput label="Title" propKey="title" />
          <TextInput label="Subtitle" propKey="subtitle" />
          <TextInput label="CTA Text" propKey="ctaText" />
          <TextInput label="Background Image" propKey="backgroundImage" />
          <RangeInput label="Overlay Opacity" propKey="overlay" min={0} max={1} step={0.1} />
          <SelectInput
            label="Alignment"
            propKey="alignment"
            options={[
              { value: 'left', label: 'Left' },
              { value: 'center', label: 'Center' },
              { value: 'right', label: 'Right' },
            ]}
          />
        </>
      );
    case 'card':
      return (
        <>
          <TextInput label="Title" propKey="title" />
          <TextInput label="Description" propKey="description" />
          <TextInput label="Image URL" propKey="image" />
          <TextInput label="Button Text" propKey="buttonText" />
        </>
      );
    case 'testimonial':
      return (
        <>
          <TextInput label="Quote" propKey="quote" />
          <TextInput label="Author" propKey="author" />
          <TextInput label="Role" propKey="role" />
          <TextInput label="Avatar URL" propKey="avatar" />
          <RangeInput label="Rating" propKey="rating" min={0} max={5} />
        </>
      );
    case 'cta':
      return (
        <>
          <TextInput label="Heading" propKey="heading" />
          <TextInput label="Description" propKey="description" />
          <TextInput label="Button Text" propKey="buttonText" />
          <SelectInput
            label="Background"
            propKey="backgroundType"
            options={[
              { value: 'gradient', label: 'Gradient' },
              { value: 'solid', label: 'Solid' },
            ]}
          />
        </>
      );
    case 'features':
      return (
        <>
          <SelectInput
            label="Columns"
            propKey="columns"
            options={[
              { value: '2', label: '2 Columns' },
              { value: '3', label: '3 Columns' },
              { value: '4', label: '4 Columns' },
            ]}
          />
        </>
      );
    case 'divider':
      return (
        <>
          <SelectInput
            label="Style"
            propKey="style"
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'dashed', label: 'Dashed' },
              { value: 'dotted', label: 'Dotted' },
              { value: 'gradient', label: 'Gradient' },
            ]}
          />
          <RangeInput label="Spacing" propKey="spacing" min={10} max={100} />
        </>
      );

    case 'productCard':
      return <ProductCardSettings props={props} onUpdate={onUpdate} />;

    case 'featuredProduct':
      return <FeaturedProductSettings props={props} onUpdate={onUpdate} />;

    case 'productGrid':
      return <ProductGridSettings props={props} onUpdate={onUpdate} />;

    case 'productCarousel':
      return <ProductCarouselSettings props={props} onUpdate={onUpdate} />;

    // ============ Course/LMS Block Settings ============
    case 'courseCard': {
      return <CourseCardSettings props={props} onUpdate={onUpdate} />;
    }

    case 'courseGrid': {
      return <CourseGridSettings props={props} onUpdate={onUpdate} />;
    }

    case 'courseCurriculum': {
      return <CourseCurriculumSettings props={props} onUpdate={onUpdate} />;
    }

    case 'courseProgress': {
      return <CourseProgressSettings props={props} onUpdate={onUpdate} />;
    }

    case 'courseInstructor': {
      return <CourseInstructorSettings props={props} onUpdate={onUpdate} />;
    }

    case 'courseCategories': {
      return <CourseCategoriesSettings props={props} onUpdate={onUpdate} />;
    }

    // ============ Shop/E-commerce Block Settings ============
    case 'shoppingCart':
      return <ShoppingCartSettings props={props} onUpdate={onUpdate} />;

    case 'productCategories':
      return <ProductCategoriesSettings props={props} onUpdate={onUpdate} />;

    case 'productFilter':
      return <ProductFilterSettings props={props} onUpdate={onUpdate} />;

    case 'checkoutSummary':
      return <CheckoutSummarySettings props={props} onUpdate={onUpdate} />;

    case 'saleBanner':
      return <SaleBannerSettings props={props} onUpdate={onUpdate} />;

    default:
      return <p className="text-gray-400 text-sm">No settings available</p>;
  }
}

// ============ Comprehensive Course/LMS Settings Components ============

// Course Card Settings - Full editing for individual course card
function CourseCardSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imagePickerTarget, setImagePickerTarget] = useState<'course' | 'instructor'>('course');

  const course = props.course || {
    id: `course-${Date.now()}`,
    title: 'Course Title',
    description: 'Course description goes here',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
    instructor: 'Instructor Name',
    instructorImage: 'https://i.pravatar.cc/100',
    duration: '8 hours',
    lessonCount: 24,
    price: 99,
    salePrice: 0,
    rating: 4.5,
    reviewCount: 128,
    enrollmentCount: 1500,
    badge: '',
    level: 'beginner',
    category: 'Development',
    courseUrl: '/courses/sample'
  };

  const updateCourse = (key: string, value: any) => {
    onUpdate({ ...props, course: { ...course, [key]: value } });
  };

  const handleMediaSelect = (media: any) => {
    if (imagePickerTarget === 'course') {
      updateCourse('image', media.path);
    } else {
      updateCourse('instructorImage', media.path);
    }
    setShowImagePicker(false);
  };

  return (
    <div className="space-y-4">
      {/* Section: Course Image */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>🖼️ Course Image</span>
        </summary>
        <div className="mt-3 space-y-3">
          {course.image && (
            <div className="relative rounded-lg overflow-hidden">
              <img src={course.image} alt="Course thumbnail" className="w-full h-32 object-cover" />
              <button
                onClick={() => { setImagePickerTarget('course'); setShowImagePicker(true); }}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
              >
                <span className="bg-blue-600 px-3 py-1 rounded text-white text-sm">Change Image</span>
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { setImagePickerTarget('course'); setShowImagePicker(true); }}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
            >
              <FiUpload size={14} /> Select from Media
            </button>
          </div>
          <input
            type="text"
            value={course.image || ''}
            onChange={(e) => updateCourse('image', e.target.value)}
            placeholder="Or paste image URL"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
          />
        </div>
      </details>

      {/* Section: Course Content */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-green-400 hover:text-green-300 py-2 border-b border-gray-700">
          <span>📝 Course Content</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Course Title</label>
            <input
              type="text"
              value={course.title || ''}
              onChange={(e) => updateCourse('title', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea
              value={course.description || ''}
              onChange={(e) => updateCourse('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Category</label>
            <input
              type="text"
              value={course.category || ''}
              onChange={(e) => updateCourse('category', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Duration</label>
              <input
                type="text"
                value={course.duration || ''}
                onChange={(e) => updateCourse('duration', e.target.value)}
                placeholder="e.g., 8 hours"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Lessons</label>
              <input
                type="number"
                value={course.lessonCount || 0}
                onChange={(e) => updateCourse('lessonCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Level</label>
            <select
              value={course.level || 'beginner'}
              onChange={(e) => updateCourse('level', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="all-levels">All Levels</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Badge Text (optional)</label>
            <input
              type="text"
              value={course.badge || ''}
              onChange={(e) => updateCourse('badge', e.target.value)}
              placeholder="e.g., Bestseller, New, Featured"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Section: Instructor */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700">
          <span>👤 Instructor</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            {course.instructorImage && (
              <img src={course.instructorImage} alt="Instructor" className="w-12 h-12 rounded-full object-cover" />
            )}
            <button
              onClick={() => { setImagePickerTarget('instructor'); setShowImagePicker(true); }}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-500 rounded text-xs text-white"
            >
              <FiUpload size={12} /> Change Photo
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Instructor Name</label>
            <input
              type="text"
              value={course.instructor || ''}
              onChange={(e) => updateCourse('instructor', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Section: Pricing */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-yellow-400 hover:text-yellow-300 py-2 border-b border-gray-700">
          <span>💰 Pricing</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Currency Symbol</label>
            <select
              value={props.currency || '$'}
              onChange={(e) => onUpdate({ ...props, currency: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY/CNY)</option>
              <option value="₹">₹ (INR)</option>
              <option value="A$">A$ (AUD)</option>
              <option value="C$">C$ (CAD)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Regular Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{props.currency || '$'}</span>
                <input
                  type="number"
                  value={course.price || 0}
                  onChange={(e) => updateCourse('price', parseFloat(e.target.value) || 0)}
                  className="w-full pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sale Price</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{props.currency || '$'}</span>
                <input
                  type="number"
                  value={course.salePrice || ''}
                  onChange={(e) => updateCourse('salePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Leave empty for no sale"
                  className="w-full pl-8 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
                />
              </div>
            </div>
          </div>
          {course.salePrice && course.salePrice < course.price && (
            <p className="text-xs text-green-400">
              💵 Discount: {Math.round(((course.price - course.salePrice) / course.price) * 100)}% off
            </p>
          )}
        </div>
      </details>

      {/* Section: Ratings & Stats */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-orange-400 hover:text-orange-300 py-2 border-b border-gray-700">
          <span>⭐ Ratings & Stats</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Rating (0-5)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={course.rating || 0}
                onChange={(e) => updateCourse('rating', parseFloat(e.target.value))}
                className="flex-1 accent-yellow-500"
              />
              <span className="text-yellow-400 font-medium w-10">{(course.rating || 0).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <FiStar
                  key={star}
                  size={16}
                  className={star <= Math.round(course.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}
                  onClick={() => updateCourse('rating', star)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Review Count</label>
              <input
                type="number"
                value={course.reviewCount || 0}
                onChange={(e) => updateCourse('reviewCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Enrollments</label>
              <input
                type="number"
                value={course.enrollmentCount || 0}
                onChange={(e) => updateCourse('enrollmentCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
          </div>
        </div>
      </details>

      {/* Section: Button & Link */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-cyan-400 hover:text-cyan-300 py-2 border-b border-gray-700">
          <span>🔗 Button & Link</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Course URL</label>
            <input
              type="text"
              value={course.courseUrl || ''}
              onChange={(e) => updateCourse('courseUrl', e.target.value)}
              placeholder="/courses/my-course"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button Text</label>
            <input
              type="text"
              value={props.buttonText || 'Enroll Now'}
              onChange={(e) => onUpdate({ ...props, buttonText: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button Style</label>
            <select
              value={props.buttonStyle || 'solid'}
              onChange={(e) => onUpdate({ ...props, buttonStyle: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="solid">Solid</option>
              <option value="outline">Outline</option>
              <option value="gradient">Gradient</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.openInNewTab || false}
              onChange={(e) => onUpdate({ ...props, openInNewTab: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Open in new tab</label>
          </div>
        </div>
      </details>

      {/* Section: Display Options */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-pink-400 hover:text-pink-300 py-2 border-b border-gray-700">
          <span>👁️ Display Options</span>
        </summary>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showInstructor !== false}
              onChange={(e) => onUpdate({ ...props, showInstructor: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Instructor</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showRating !== false}
              onChange={(e) => onUpdate({ ...props, showRating: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Rating</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showPrice !== false}
              onChange={(e) => onUpdate({ ...props, showPrice: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Price</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showBadge !== false}
              onChange={(e) => onUpdate({ ...props, showBadge: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Badge</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showLevel !== false}
              onChange={(e) => onUpdate({ ...props, showLevel: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Level</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showDuration !== false}
              onChange={(e) => onUpdate({ ...props, showDuration: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Duration & Lessons</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showEnrollments || false}
              onChange={(e) => onUpdate({ ...props, showEnrollments: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Enrollment Count</label>
          </div>
        </div>
      </details>

      {showImagePicker && (
        <MediaPickerModal
          type="image"
          onSelect={handleMediaSelect}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}


// Course Grid Settings - Manage multiple courses in a grid
function CourseGridSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [editingCourseIndex, setEditingCourseIndex] = useState<number | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<number | null>(null);

  const courses: CourseData[] = props.courses || [];
  const columns = props.columns || 3;

  const addCourse = () => {
    const newCourse: CourseData = {
      id: `course-${Date.now()}`,
      title: `Course ${courses.length + 1}`,
      description: 'Course description',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
      instructor: 'Instructor Name',
      instructorImage: 'https://i.pravatar.cc/100',
      duration: '8 hours',
      lessonCount: 24,
      price: 99,
      rating: 4.5,
      reviewCount: 100,
      enrollmentCount: 500,
      level: 'beginner',
      category: 'General'
    };
    onUpdate({ ...props, courses: [...courses, newCourse] });
    setExpandedCourse(courses.length);
  };

  const updateCourseAtIndex = (index: number, key: string, value: any) => {
    const updated = [...courses];
    updated[index] = { ...updated[index], [key]: value };
    onUpdate({ ...props, courses: updated });
  };

  const removeCourse = (index: number) => {
    const updated = courses.filter((_, i) => i !== index);
    onUpdate({ ...props, courses: updated });
    if (expandedCourse === index) setExpandedCourse(null);
  };

  const moveCourse = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= courses.length) return;
    const updated = [...courses];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onUpdate({ ...props, courses: updated });
  };

  const handleMediaSelect = (media: any) => {
    if (editingCourseIndex !== null) {
      updateCourseAtIndex(editingCourseIndex, 'image', media.path);
    }
    setShowImagePicker(false);
    setEditingCourseIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Layout Options */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>📐 Layout Options</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Columns</label>
            <select
              value={columns}
              onChange={(e) => onUpdate({ ...props, columns: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns</option>
              <option value={4}>4 Columns</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Gap Size</label>
            <select
              value={props.gap || 'medium'}
              onChange={(e) => onUpdate({ ...props, gap: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="small">Small (16px)</option>
              <option value="medium">Medium (24px)</option>
              <option value="large">Large (32px)</option>
            </select>
          </div>
        </div>
      </details>

      {/* Display Options */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-green-400 hover:text-green-300 py-2 border-b border-gray-700">
          <span>👁️ Display Options</span>
        </summary>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showInstructor !== false}
              onChange={(e) => onUpdate({ ...props, showInstructor: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Instructor</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showRating !== false}
              onChange={(e) => onUpdate({ ...props, showRating: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Rating</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showPrice !== false}
              onChange={(e) => onUpdate({ ...props, showPrice: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Price</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showFilters || false}
              onChange={(e) => onUpdate({ ...props, showFilters: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Category Filters</label>
          </div>
        </div>
      </details>

      {/* Courses List */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700">
          <span>📚 Courses ({courses.length})</span>
        </summary>
        <div className="mt-3 space-y-2">
          {courses.map((course, index) => (
            <div key={course.id || index} className="bg-gray-700/50 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-600/50"
                onClick={() => setExpandedCourse(expandedCourse === index ? null : index)}
              >
                <img src={course.image} alt="" className="w-10 h-10 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{course.title}</p>
                  <p className="text-xs text-gray-400">${course.price}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); moveCourse(index, 'up'); }} className="p-1 hover:bg-gray-600 rounded" disabled={index === 0}>
                    <FiArrowUp size={12} className={index === 0 ? 'text-gray-600' : 'text-gray-400'} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveCourse(index, 'down'); }} className="p-1 hover:bg-gray-600 rounded" disabled={index === courses.length - 1}>
                    <FiArrowDown size={12} className={index === courses.length - 1 ? 'text-gray-600' : 'text-gray-400'} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeCourse(index); }} className="p-1 hover:bg-red-600 rounded">
                    <FiTrash2 size={12} className="text-red-400" />
                  </button>
                </div>
              </div>

              {expandedCourse === index && (
                <div className="p-3 border-t border-gray-600 space-y-2">
                  <input
                    type="text"
                    value={course.title}
                    onChange={(e) => updateCourseAtIndex(index, 'title', e.target.value)}
                    placeholder="Course Title"
                    className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingCourseIndex(index); setShowImagePicker(true); }}
                      className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs text-white"
                    >
                      <FiImage size={10} /> Image
                    </button>
                    <input
                      type="text"
                      value={course.image}
                      onChange={(e) => updateCourseAtIndex(index, 'image', e.target.value)}
                      placeholder="Image URL"
                      className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={course.price}
                      onChange={(e) => updateCourseAtIndex(index, 'price', parseFloat(e.target.value))}
                      placeholder="Price"
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                    />
                    <input
                      type="number"
                      value={course.salePrice || ''}
                      onChange={(e) => updateCourseAtIndex(index, 'salePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="Sale Price"
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                    />
                  </div>
                  <input
                    type="text"
                    value={course.instructor}
                    onChange={(e) => updateCourseAtIndex(index, 'instructor', e.target.value)}
                    placeholder="Instructor"
                    className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={course.duration}
                      onChange={(e) => updateCourseAtIndex(index, 'duration', e.target.value)}
                      placeholder="Duration"
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                    />
                    <input
                      type="number"
                      value={course.lessonCount}
                      onChange={(e) => updateCourseAtIndex(index, 'lessonCount', parseInt(e.target.value))}
                      placeholder="Lessons"
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-400">Rating:</label>
                    <input
                      type="range"
                      min="0"
                      max="5"
                      step="0.1"
                      value={course.rating}
                      onChange={(e) => updateCourseAtIndex(index, 'rating', parseFloat(e.target.value))}
                      className="flex-1 accent-yellow-500"
                    />
                    <span className="text-xs text-yellow-400">{course.rating}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addCourse}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
          >
            <FiPlus size={14} /> Add Course
          </button>
        </div>
      </details>

      {showImagePicker && (
        <MediaPickerModal
          type="image"
          onSelect={handleMediaSelect}
          onClose={() => { setShowImagePicker(false); setEditingCourseIndex(null); }}
        />
      )}
    </div>
  );
}


// Course Curriculum Settings - Edit modules and lessons
function CourseCurriculumSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [expandedModule, setExpandedModule] = useState<number | null>(0);

  const modules: ModuleData[] = props.modules || [];

  const addModule = () => {
    const newModule: ModuleData = {
      id: `module-${Date.now()}`,
      title: `Module ${modules.length + 1}`,
      duration: '1 hour',
      lessons: []
    };
    onUpdate({ ...props, modules: [...modules, newModule] });
    setExpandedModule(modules.length);
  };

  const updateModuleAtIndex = (index: number, key: string, value: any) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], [key]: value };
    onUpdate({ ...props, modules: updated });
  };

  const removeModule = (index: number) => {
    const updated = modules.filter((_, i) => i !== index);
    onUpdate({ ...props, modules: updated });
    if (expandedModule === index) setExpandedModule(null);
  };

  const addLesson = (moduleIndex: number) => {
    const newLesson = {
      id: `lesson-${Date.now()}`,
      title: `Lesson ${modules[moduleIndex].lessons.length + 1}`,
      duration: '10 min',
      type: 'video' as const,
      isPreview: false,
      isCompleted: false
    };
    const updated = [...modules];
    updated[moduleIndex] = {
      ...updated[moduleIndex],
      lessons: [...updated[moduleIndex].lessons, newLesson]
    };
    onUpdate({ ...props, modules: updated });
  };

  const updateLessonAtIndex = (moduleIndex: number, lessonIndex: number, key: string, value: any) => {
    const updated = [...modules];
    updated[moduleIndex] = {
      ...updated[moduleIndex],
      lessons: updated[moduleIndex].lessons.map((lesson, i) =>
        i === lessonIndex ? { ...lesson, [key]: value } : lesson
      )
    };
    onUpdate({ ...props, modules: updated });
  };

  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex] = {
      ...updated[moduleIndex],
      lessons: updated[moduleIndex].lessons.filter((_, i) => i !== lessonIndex)
    };
    onUpdate({ ...props, modules: updated });
  };

  const lessonIcons = { video: '🎥', text: '📖', quiz: '❓', assignment: '📝' };

  return (
    <div className="space-y-4">
      {/* Course Title */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>📋 Curriculum Header</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Section Title</label>
            <input
              type="text"
              value={props.courseTitle || 'Course Curriculum'}
              onChange={(e) => onUpdate({ ...props, courseTitle: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Display Options */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-green-400 hover:text-green-300 py-2 border-b border-gray-700">
          <span>👁️ Display Options</span>
        </summary>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showDuration !== false}
              onChange={(e) => onUpdate({ ...props, showDuration: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Duration</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showLessonCount !== false}
              onChange={(e) => onUpdate({ ...props, showLessonCount: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Lesson Count</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.expandedByDefault || false}
              onChange={(e) => onUpdate({ ...props, expandedByDefault: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Expand All by Default</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showPreviewBadge !== false}
              onChange={(e) => onUpdate({ ...props, showPreviewBadge: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show "Preview" Badge</label>
          </div>
        </div>
      </details>

      {/* Modules */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700">
          <span>📚 Modules ({modules.length})</span>
        </summary>
        <div className="mt-3 space-y-2">
          {modules.map((module, moduleIndex) => (
            <div key={module.id || moduleIndex} className="bg-gray-700/50 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-600/50"
                onClick={() => setExpandedModule(expandedModule === moduleIndex ? null : moduleIndex)}
              >
                <FiFolder className="text-yellow-400" size={16} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{module.title}</p>
                  <p className="text-xs text-gray-400">{module.lessons.length} lessons • {module.duration}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeModule(moduleIndex); }} className="p-1 hover:bg-red-600 rounded">
                  <FiTrash2 size={12} className="text-red-400" />
                </button>
              </div>

              {expandedModule === moduleIndex && (
                <div className="p-3 border-t border-gray-600 space-y-3">
                  <input
                    type="text"
                    value={module.title}
                    onChange={(e) => updateModuleAtIndex(moduleIndex, 'title', e.target.value)}
                    placeholder="Module Title"
                    className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                  />
                  <input
                    type="text"
                    value={module.duration}
                    onChange={(e) => updateModuleAtIndex(moduleIndex, 'duration', e.target.value)}
                    placeholder="Duration (e.g., 2 hours)"
                    className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                  />

                  {/* Lessons */}
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400">Lessons:</p>
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id || lessonIndex} className="bg-gray-600/50 rounded p-2">
                        <div className="flex items-center gap-2">
                          <span>{lessonIcons[lesson.type]}</span>
                          <input
                            type="text"
                            value={lesson.title}
                            onChange={(e) => updateLessonAtIndex(moduleIndex, lessonIndex, 'title', e.target.value)}
                            className="flex-1 px-2 py-1 bg-gray-700 border border-gray-500 rounded text-xs text-white"
                          />
                          <button onClick={() => removeLesson(moduleIndex, lessonIndex)} className="p-1 hover:bg-red-600 rounded">
                            <FiTrash2 size={10} className="text-red-400" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <select
                            value={lesson.type}
                            onChange={(e) => updateLessonAtIndex(moduleIndex, lessonIndex, 'type', e.target.value)}
                            className="px-2 py-1 bg-gray-700 border border-gray-500 rounded text-xs text-white"
                          >
                            <option value="video">🎥 Video</option>
                            <option value="text">📖 Text</option>
                            <option value="quiz">❓ Quiz</option>
                            <option value="assignment">📝 Assignment</option>
                          </select>
                          <input
                            type="text"
                            value={lesson.duration}
                            onChange={(e) => updateLessonAtIndex(moduleIndex, lessonIndex, 'duration', e.target.value)}
                            placeholder="Duration"
                            className="w-20 px-2 py-1 bg-gray-700 border border-gray-500 rounded text-xs text-white"
                          />
                          <label className="flex items-center gap-1 text-xs text-gray-400">
                            <input
                              type="checkbox"
                              checked={lesson.isPreview || false}
                              onChange={(e) => updateLessonAtIndex(moduleIndex, lessonIndex, 'isPreview', e.target.checked)}
                              className="w-3 h-3"
                            />
                            Preview
                          </label>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => addLesson(moduleIndex)}
                      className="w-full flex items-center justify-center gap-1 px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-white"
                    >
                      <FiPlus size={10} /> Add Lesson
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addModule}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
          >
            <FiPlus size={14} /> Add Module
          </button>
        </div>
      </details>
    </div>
  );
}


// Course Progress Settings - Edit progress display
function CourseProgressSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [showImagePicker, setShowImagePicker] = useState(false);

  const progress = props.progress || {
    courseId: 'course-1',
    courseTitle: 'Course Title',
    courseImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400',
    progress: 65,
    completedLessons: 16,
    totalLessons: 24,
    lastAccessedLesson: 'Introduction to React Hooks',
    continueUrl: '/courses/sample/lesson-17'
  };

  const updateProgress = (key: string, value: any) => {
    onUpdate({ ...props, progress: { ...progress, [key]: value } });
  };

  const handleMediaSelect = (media: any) => {
    updateProgress('courseImage', media.path);
    setShowImagePicker(false);
  };

  return (
    <div className="space-y-4">
      {/* Course Image */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>🖼️ Course Image</span>
        </summary>
        <div className="mt-3 space-y-3">
          {progress.courseImage && (
            <div className="relative rounded-lg overflow-hidden">
              <img src={progress.courseImage} alt="Course" className="w-full h-24 object-cover" />
              <button
                onClick={() => setShowImagePicker(true)}
                className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity"
              >
                <span className="bg-blue-600 px-3 py-1 rounded text-white text-sm">Change</span>
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setShowImagePicker(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
            >
              <FiUpload size={14} /> Select Image
            </button>
          </div>
          <input
            type="text"
            value={progress.courseImage || ''}
            onChange={(e) => updateProgress('courseImage', e.target.value)}
            placeholder="Or paste image URL"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
          />
        </div>
      </details>

      {/* Course Info */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-green-400 hover:text-green-300 py-2 border-b border-gray-700">
          <span>📝 Course Info</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Course Title</label>
            <input
              type="text"
              value={progress.courseTitle || ''}
              onChange={(e) => updateProgress('courseTitle', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Last Accessed Lesson</label>
            <input
              type="text"
              value={progress.lastAccessedLesson || ''}
              onChange={(e) => updateProgress('lastAccessedLesson', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Continue URL</label>
            <input
              type="text"
              value={progress.continueUrl || ''}
              onChange={(e) => updateProgress('continueUrl', e.target.value)}
              placeholder="/courses/my-course/lesson-5"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Progress Stats */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700">
          <span>📊 Progress Stats</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Progress Percentage</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={progress.progress || 0}
                onChange={(e) => updateProgress('progress', parseInt(e.target.value))}
                className="flex-1 accent-green-500"
              />
              <span className="text-green-400 font-medium w-12">{progress.progress || 0}%</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2 mt-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${progress.progress || 0}%` }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Completed Lessons</label>
              <input
                type="number"
                min="0"
                value={progress.completedLessons || 0}
                onChange={(e) => updateProgress('completedLessons', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Total Lessons</label>
              <input
                type="number"
                min="1"
                value={progress.totalLessons || 1}
                onChange={(e) => updateProgress('totalLessons', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
          </div>
          <button
            onClick={() => {
              const pct = Math.round((progress.completedLessons / progress.totalLessons) * 100);
              updateProgress('progress', pct);
            }}
            className="w-full px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs text-white"
          >
            Auto-calculate from lessons
          </button>
        </div>
      </details>

      {/* Display Options */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-yellow-400 hover:text-yellow-300 py-2 border-b border-gray-700">
          <span>👁️ Display Options</span>
        </summary>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showContinueButton !== false}
              onChange={(e) => onUpdate({ ...props, showContinueButton: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Continue Button</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showPercentage !== false}
              onChange={(e) => onUpdate({ ...props, showPercentage: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Percentage</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showLessonCount !== false}
              onChange={(e) => onUpdate({ ...props, showLessonCount: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Lesson Count</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showLastAccessed !== false}
              onChange={(e) => onUpdate({ ...props, showLastAccessed: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Last Accessed Lesson</label>
          </div>
        </div>
      </details>

      {/* Button Customization */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-cyan-400 hover:text-cyan-300 py-2 border-b border-gray-700">
          <span>🔘 Button Customization</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button Text</label>
            <input
              type="text"
              value={props.buttonText || 'Continue Learning'}
              onChange={(e) => onUpdate({ ...props, buttonText: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button Style</label>
            <select
              value={props.buttonStyle || 'solid'}
              onChange={(e) => onUpdate({ ...props, buttonStyle: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="solid">Solid</option>
              <option value="outline">Outline</option>
              <option value="gradient">Gradient</option>
            </select>
          </div>
        </div>
      </details>

      {showImagePicker && (
        <MediaPickerModal
          type="image"
          onSelect={handleMediaSelect}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}


// Course Instructor Settings - Full instructor profile editing
function CourseInstructorSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [showImagePicker, setShowImagePicker] = useState(false);

  const instructor = props.instructor || {
    id: 'instructor-1',
    name: 'John Doe',
    photo: 'https://i.pravatar.cc/200',
    title: 'Senior Developer',
    bio: 'Experienced developer with 10+ years in the industry.',
    credentials: 'MSc Computer Science, AWS Certified',
    rating: 4.8,
    reviewCount: 256,
    courseCount: 12,
    studentCount: 15000,
    socialLinks: {
      twitter: '',
      linkedin: '',
      website: ''
    }
  };

  const updateInstructor = (key: string, value: any) => {
    onUpdate({ ...props, instructor: { ...instructor, [key]: value } });
  };

  const updateSocialLink = (platform: string, value: string) => {
    updateInstructor('socialLinks', { ...instructor.socialLinks, [platform]: value });
  };

  const handleMediaSelect = (media: any) => {
    updateInstructor('photo', media.path);
    setShowImagePicker(false);
  };

  return (
    <div className="space-y-4">
      {/* Instructor Photo */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>📷 Instructor Photo</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-4">
            {instructor.photo && (
              <div className="relative">
                <img src={instructor.photo} alt="Instructor" className="w-20 h-20 rounded-full object-cover" />
                <button
                  onClick={() => setShowImagePicker(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity"
                >
                  <FiUpload className="text-white" size={20} />
                </button>
              </div>
            )}
            <button
              onClick={() => setShowImagePicker(true)}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
            >
              <FiUpload size={14} /> Change Photo
            </button>
          </div>
          <input
            type="text"
            value={instructor.photo || ''}
            onChange={(e) => updateInstructor('photo', e.target.value)}
            placeholder="Or paste image URL"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
          />
        </div>
      </details>

      {/* Basic Info */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-green-400 hover:text-green-300 py-2 border-b border-gray-700">
          <span>👤 Basic Info</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Name</label>
            <input
              type="text"
              value={instructor.name || ''}
              onChange={(e) => updateInstructor('name', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title / Role</label>
            <input
              type="text"
              value={instructor.title || ''}
              onChange={(e) => updateInstructor('title', e.target.value)}
              placeholder="e.g., Senior Developer, Course Creator"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Bio</label>
            <textarea
              value={instructor.bio || ''}
              onChange={(e) => updateInstructor('bio', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Credentials</label>
            <input
              type="text"
              value={instructor.credentials || ''}
              onChange={(e) => updateInstructor('credentials', e.target.value)}
              placeholder="e.g., PhD, AWS Certified, 10+ years experience"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Stats */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700">
          <span>📊 Stats & Ratings</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Rating (0-5)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.1"
                value={instructor.rating || 0}
                onChange={(e) => updateInstructor('rating', parseFloat(e.target.value))}
                className="flex-1 accent-yellow-500"
              />
              <span className="text-yellow-400 font-medium w-10">{(instructor.rating || 0).toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(star => (
                <FiStar
                  key={star}
                  size={16}
                  className={star <= Math.round(instructor.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}
                  onClick={() => updateInstructor('rating', star)}
                  style={{ cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Review Count</label>
              <input
                type="number"
                value={instructor.reviewCount || 0}
                onChange={(e) => updateInstructor('reviewCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Course Count</label>
              <input
                type="number"
                value={instructor.courseCount || 0}
                onChange={(e) => updateInstructor('courseCount', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Total Students</label>
            <input
              type="number"
              value={instructor.studentCount || 0}
              onChange={(e) => updateInstructor('studentCount', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Social Links */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-cyan-400 hover:text-cyan-300 py-2 border-b border-gray-700">
          <span>🔗 Social Links</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Twitter / X</label>
            <input
              type="text"
              value={instructor.socialLinks?.twitter || ''}
              onChange={(e) => updateSocialLink('twitter', e.target.value)}
              placeholder="https://twitter.com/username"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">LinkedIn</label>
            <input
              type="text"
              value={instructor.socialLinks?.linkedin || ''}
              onChange={(e) => updateSocialLink('linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Website</label>
            <input
              type="text"
              value={instructor.socialLinks?.website || ''}
              onChange={(e) => updateSocialLink('website', e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Display Options */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-yellow-400 hover:text-yellow-300 py-2 border-b border-gray-700">
          <span>👁️ Display Options</span>
        </summary>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showStats !== false}
              onChange={(e) => onUpdate({ ...props, showStats: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Stats (Courses, Students)</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showRating !== false}
              onChange={(e) => onUpdate({ ...props, showRating: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Rating</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showSocial !== false}
              onChange={(e) => onUpdate({ ...props, showSocial: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Social Links</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showCredentials !== false}
              onChange={(e) => onUpdate({ ...props, showCredentials: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Credentials</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showBio !== false}
              onChange={(e) => onUpdate({ ...props, showBio: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Bio</label>
          </div>
        </div>
      </details>

      {showImagePicker && (
        <MediaPickerModal
          type="image"
          onSelect={handleMediaSelect}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </div>
  );
}


// Course Categories Settings - Manage category display
function CourseCategoriesSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const categories: CourseCategoryData[] = props.categories || [];

  const addCategory = () => {
    const newCategory: CourseCategoryData = {
      id: `category-${Date.now()}`,
      name: `Category ${categories.length + 1}`,
      slug: `category-${categories.length + 1}`,
      icon: '📚',
      courseCount: 0,
      color: '#3B82F6'
    };
    onUpdate({ ...props, categories: [...categories, newCategory] });
    setExpandedCategory(categories.length);
  };

  const updateCategoryAtIndex = (index: number, key: string, value: any) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [key]: value };
    onUpdate({ ...props, categories: updated });
  };

  const removeCategory = (index: number) => {
    const updated = categories.filter((_, i) => i !== index);
    onUpdate({ ...props, categories: updated });
    if (expandedCategory === index) setExpandedCategory(null);
  };

  const moveCategory = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categories.length) return;
    const updated = [...categories];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    onUpdate({ ...props, categories: updated });
  };

  const iconOptions = ['📚', '💻', '🎨', '📊', '🎵', '📷', '✏️', '🔬', '💼', '🏋️', '🍳', '🌍', '🎮', '📱', '🔧'];

  return (
    <div className="space-y-4">
      {/* Layout Options */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>📐 Layout Options</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Columns</label>
            <select
              value={props.columns || 3}
              onChange={(e) => onUpdate({ ...props, columns: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value={2}>2 Columns</option>
              <option value={3}>3 Columns</option>
              <option value={4}>4 Columns</option>
              <option value={6}>6 Columns</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Style</label>
            <select
              value={props.style || 'cards'}
              onChange={(e) => onUpdate({ ...props, style: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="cards">Cards with Background</option>
              <option value="minimal">Minimal Text</option>
              <option value="icons">Icon Focused</option>
              <option value="pills">Pill Buttons</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Gap Size</label>
            <select
              value={props.gap || 'medium'}
              onChange={(e) => onUpdate({ ...props, gap: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="small">Small (12px)</option>
              <option value="medium">Medium (20px)</option>
              <option value="large">Large (32px)</option>
            </select>
          </div>
        </div>
      </details>

      {/* Display Options */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-green-400 hover:text-green-300 py-2 border-b border-gray-700">
          <span>👁️ Display Options</span>
        </summary>
        <div className="mt-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showIcon !== false}
              onChange={(e) => onUpdate({ ...props, showIcon: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Icon</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showCourseCount !== false}
              onChange={(e) => onUpdate({ ...props, showCourseCount: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Show Course Count</label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showColor !== false}
              onChange={(e) => onUpdate({ ...props, showColor: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Use Category Colors</label>
          </div>
        </div>
      </details>

      {/* Categories List */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700">
          <span>📂 Categories ({categories.length})</span>
        </summary>
        <div className="mt-3 space-y-2">
          {categories.map((category, index) => (
            <div key={category.id || index} className="bg-gray-700/50 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-600/50"
                onClick={() => setExpandedCategory(expandedCategory === index ? null : index)}
              >
                <span className="text-xl">{category.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{category.name}</p>
                  <p className="text-xs text-gray-400">{category.courseCount} courses</p>
                </div>
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: category.color || '#3B82F6' }}
                />
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); moveCategory(index, 'up'); }} className="p-1 hover:bg-gray-600 rounded" disabled={index === 0}>
                    <FiArrowUp size={12} className={index === 0 ? 'text-gray-600' : 'text-gray-400'} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveCategory(index, 'down'); }} className="p-1 hover:bg-gray-600 rounded" disabled={index === categories.length - 1}>
                    <FiArrowDown size={12} className={index === categories.length - 1 ? 'text-gray-600' : 'text-gray-400'} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeCategory(index); }} className="p-1 hover:bg-red-600 rounded">
                    <FiTrash2 size={12} className="text-red-400" />
                  </button>
                </div>
              </div>

              {expandedCategory === index && (
                <div className="p-3 border-t border-gray-600 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Category Name</label>
                    <input
                      type="text"
                      value={category.name}
                      onChange={(e) => updateCategoryAtIndex(index, 'name', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Slug (URL)</label>
                    <input
                      type="text"
                      value={category.slug}
                      onChange={(e) => updateCategoryAtIndex(index, 'slug', e.target.value)}
                      className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Icon</label>
                    <div className="flex flex-wrap gap-1">
                      {iconOptions.map(icon => (
                        <button
                          key={icon}
                          onClick={() => updateCategoryAtIndex(index, 'icon', icon)}
                          className={`w-8 h-8 flex items-center justify-center rounded ${category.icon === icon ? 'bg-blue-600' : 'bg-gray-600 hover:bg-gray-500'}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Course Count</label>
                      <input
                        type="number"
                        value={category.courseCount}
                        onChange={(e) => updateCategoryAtIndex(index, 'courseCount', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Color</label>
                      <div className="flex gap-1">
                        <input
                          type="color"
                          value={category.color || '#3B82F6'}
                          onChange={(e) => updateCategoryAtIndex(index, 'color', e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={category.color || '#3B82F6'}
                          onChange={(e) => updateCategoryAtIndex(index, 'color', e.target.value)}
                          className="flex-1 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addCategory}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
          >
            <FiPlus size={14} /> Add Category
          </button>
        </div>
      </details>
    </div>
  );
}

// ============ Comprehensive Shop/E-commerce Settings Components ============

// Product Card Settings - Full editing for individual product card
function ProductCardSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);

  const product = props.product || {
    id: `product-${Date.now()}`,
    title: 'Product Title',
    description: 'Product description goes here',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    gallery: [],
    price: 99.99,
    salePrice: 0,
    currency: 'USD',
    rating: 4.5,
    reviewCount: 128,
    badge: '',
    category: 'Electronics',
    sku: 'SKU-001',
    inStock: true,
    stockQuantity: 100,
    productUrl: '/products/product-1',
    quickViewEnabled: true,
  };

  const updateProduct = (key: string, value: any) => {
    onUpdate({ ...props, product: { ...product, [key]: value } });
  };

  const currencies = [
    { value: 'USD', label: '$ USD', symbol: '$' },
    { value: 'EUR', label: '€ EUR', symbol: '€' },
    { value: 'GBP', label: '£ GBP', symbol: '£' },
    { value: 'JPY', label: '¥ JPY', symbol: '¥' },
    { value: 'AUD', label: 'A$ AUD', symbol: 'A$' },
    { value: 'CAD', label: 'C$ CAD', symbol: 'C$' },
  ];

  const discountPercent = product.salePrice && product.price > 0
    ? Math.round((1 - product.salePrice / product.price) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Media Picker Modal */}
      {showImagePicker && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => {
            updateProduct('image', media.path || media.url);
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
      {showGalleryPicker && (
        <MediaPickerModal
          type="gallery"
          onSelect={(media) => {
            const currentGallery = product.gallery || [];
            updateProduct('gallery', [...currentGallery, media.path || media.url]);
            setShowGalleryPicker(false);
          }}
          onClose={() => setShowGalleryPicker(false)}
        />
      )}

      {/* Product Image */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-emerald-400 hover:text-emerald-300 py-2 border-b border-gray-700">
          <span>🖼️ Product Image</span>
        </summary>
        <div className="mt-3 space-y-3">
          {product.image ? (
            <div className="relative rounded-lg overflow-hidden">
              <img src={product.image} alt="" className="w-full h-32 object-cover" />
              <button
                onClick={() => updateProduct('image', '')}
                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
              >
                <FiX size={14} />
              </button>
            </div>
          ) : (
            <div className="h-32 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 text-sm">No image selected</span>
            </div>
          )}
          <button
            onClick={() => setShowImagePicker(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm text-white"
          >
            <FiImage size={14} /> Select Product Image
          </button>
          <input
            type="text"
            value={product.image || ''}
            onChange={(e) => updateProduct('image', e.target.value)}
            placeholder="Or paste image URL"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
          />
        </div>
      </details>

      {/* Product Gallery */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-emerald-400 hover:text-emerald-300 py-2 border-b border-gray-700">
          <span>🖼️ Product Gallery ({(product.gallery || []).length})</span>
        </summary>
        <div className="mt-3 space-y-3">
          {(product.gallery || []).length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {product.gallery.map((img: string, idx: number) => (
                <div key={idx} className="relative rounded overflow-hidden">
                  <img src={img} alt="" className="w-full h-16 object-cover" />
                  <button
                    onClick={() => {
                      const newGallery = product.gallery.filter((_: string, i: number) => i !== idx);
                      updateProduct('gallery', newGallery);
                    }}
                    className="absolute top-1 right-1 p-0.5 bg-red-500 rounded-full text-white"
                  >
                    <FiX size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowGalleryPicker(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm text-white"
          >
            <FiPlus size={14} /> Add Gallery Image
          </button>
        </div>
      </details>

      {/* Product Content */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>📝 Product Content</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Product Title</label>
            <input
              type="text"
              value={product.title || ''}
              onChange={(e) => updateProduct('title', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea
              value={product.description || ''}
              onChange={(e) => updateProduct('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Category</label>
              <input
                type="text"
                value={product.category || ''}
                onChange={(e) => updateProduct('category', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">SKU</label>
              <input
                type="text"
                value={product.sku || ''}
                onChange={(e) => updateProduct('sku', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Badge</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {['Sale', 'New', 'Hot', 'Bestseller', 'Limited'].map((badge) => (
                <button
                  key={badge}
                  onClick={() => updateProduct('badge', badge)}
                  className={`px-2 py-1 rounded text-xs ${product.badge === badge ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                >
                  {badge}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={product.badge || ''}
              onChange={(e) => updateProduct('badge', e.target.value)}
              placeholder="Custom badge text"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Pricing */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-yellow-400 hover:text-yellow-300 py-2 border-b border-gray-700">
          <span>💰 Pricing</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Currency</label>
            <select
              value={product.currency || 'USD'}
              onChange={(e) => updateProduct('currency', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              {currencies.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Regular Price</label>
              <input
                type="number"
                value={product.price || 0}
                onChange={(e) => updateProduct('price', parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sale Price</label>
              <input
                type="number"
                value={product.salePrice || ''}
                onChange={(e) => updateProduct('salePrice', e.target.value ? parseFloat(e.target.value) : 0)}
                min="0"
                step="0.01"
                placeholder="Optional"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
          </div>
          {discountPercent > 0 && (
            <div className="px-3 py-2 bg-green-900/30 border border-green-600/30 rounded-lg">
              <span className="text-green-400 text-sm font-medium">🎉 {discountPercent}% OFF</span>
            </div>
          )}
        </div>
      </details>

      {/* Ratings & Reviews */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-orange-400 hover:text-orange-300 py-2 border-b border-gray-700">
          <span>⭐ Ratings & Reviews</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Rating: {product.rating || 0} / 5</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={product.rating || 0}
              onChange={(e) => updateProduct('rating', parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => updateProduct('rating', star)}
                  className="text-xl transition-transform hover:scale-125"
                >
                  {star <= Math.floor(product.rating || 0) ? '⭐' : '☆'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Review Count</label>
            <input
              type="number"
              value={product.reviewCount || 0}
              onChange={(e) => updateProduct('reviewCount', parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Stock & Inventory */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-cyan-400 hover:text-cyan-300 py-2 border-b border-gray-700">
          <span>📦 Stock & Inventory</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={product.inStock !== false}
              onChange={(e) => updateProduct('inStock', e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500"
            />
            <label className="text-xs text-gray-400">In Stock</label>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Stock Quantity</label>
            <input
              type="number"
              value={product.stockQuantity || 0}
              onChange={(e) => updateProduct('stockQuantity', parseInt(e.target.value) || 0)}
              min="0"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Button & Link */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-pink-400 hover:text-pink-300 py-2 border-b border-gray-700">
          <span>🔗 Button & Link</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Product URL</label>
            <input
              type="text"
              value={product.productUrl || ''}
              onChange={(e) => updateProduct('productUrl', e.target.value)}
              placeholder="/products/my-product"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button Text</label>
            <input
              type="text"
              value={props.buttonText || 'Add to Cart'}
              onChange={(e) => onUpdate({ ...props, buttonText: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button Style</label>
            <div className="grid grid-cols-3 gap-2">
              {(['solid', 'outline', 'icon'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => onUpdate({ ...props, buttonStyle: style })}
                  className={`px-3 py-2 rounded-lg text-xs capitalize ${props.buttonStyle === style ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={product.quickViewEnabled !== false}
              onChange={(e) => updateProduct('quickViewEnabled', e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500"
            />
            <label className="text-xs text-gray-400">Enable Quick View</label>
          </div>
        </div>
      </details>

      {/* Display Options */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-gray-400 hover:text-gray-300 py-2 border-b border-gray-700">
          <span>👁️ Display Options</span>
        </summary>
        <div className="mt-3 space-y-2">
          {[
            { key: 'showRating', label: 'Show Rating' },
            { key: 'showBadge', label: 'Show Badge' },
            { key: 'showPrice', label: 'Show Price' },
            { key: 'showCategory', label: 'Show Category' },
            { key: 'showStock', label: 'Show Stock Status' },
            { key: 'showWishlist', label: 'Show Wishlist Button' },
            { key: 'showCompare', label: 'Show Compare Button' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={props[key] !== false}
                onChange={(e) => onUpdate({ ...props, [key]: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
              />
              <label className="text-xs text-gray-400">{label}</label>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

// Featured Product Settings - Extended product card with layout options
function FeaturedProductSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [showImagePicker, setShowImagePicker] = useState(false);

  const product = props.product || {
    id: `product-${Date.now()}`,
    title: 'Featured Product',
    description: 'This amazing product is our top seller with exceptional quality.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
    price: 199.99,
    salePrice: 149.99,
    currency: 'USD',
    rating: 4.8,
    reviewCount: 256,
    badge: 'Featured',
    features: ['Premium Quality', 'Free Shipping', '30-Day Returns', '2-Year Warranty'],
  };

  const updateProduct = (key: string, value: any) => {
    onUpdate({ ...props, product: { ...product, [key]: value } });
  };

  return (
    <div className="space-y-4">
      {showImagePicker && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => {
            updateProduct('image', media.path || media.url);
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {/* Layout */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700">
          <span>📐 Layout</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Image Position</label>
            <div className="grid grid-cols-2 gap-2">
              {(['left', 'right'] as const).map((layout) => (
                <button
                  key={layout}
                  onClick={() => onUpdate({ ...props, layout })}
                  className={`px-4 py-3 rounded-lg text-sm capitalize flex items-center justify-center gap-2 ${props.layout === layout ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                >
                  {layout === 'left' ? '🖼️ ←' : '→ 🖼️'} {layout}
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>

      {/* Product Image */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-emerald-400 hover:text-emerald-300 py-2 border-b border-gray-700">
          <span>🖼️ Product Image</span>
        </summary>
        <div className="mt-3 space-y-3">
          {product.image && (
            <div className="relative rounded-lg overflow-hidden">
              <img src={product.image} alt="" className="w-full h-40 object-cover" />
              <button
                onClick={() => updateProduct('image', '')}
                className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white"
              >
                <FiX size={14} />
              </button>
            </div>
          )}
          <button
            onClick={() => setShowImagePicker(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm text-white"
          >
            <FiImage size={14} /> Select Image
          </button>
        </div>
      </details>

      {/* Product Content */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>📝 Product Content</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={product.title || ''}
              onChange={(e) => updateProduct('title', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea
              value={product.description || ''}
              onChange={(e) => updateProduct('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Badge</label>
            <input
              type="text"
              value={product.badge || ''}
              onChange={(e) => updateProduct('badge', e.target.value)}
              placeholder="Featured, Best Seller, etc."
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Features List */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-cyan-400 hover:text-cyan-300 py-2 border-b border-gray-700">
          <span>✨ Features ({(product.features || []).length})</span>
        </summary>
        <div className="mt-3 space-y-2">
          {(product.features || []).map((feature: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <input
                type="text"
                value={feature}
                onChange={(e) => {
                  const newFeatures = [...(product.features || [])];
                  newFeatures[idx] = e.target.value;
                  updateProduct('features', newFeatures);
                }}
                className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
              />
              <button
                onClick={() => {
                  const newFeatures = (product.features || []).filter((_: string, i: number) => i !== idx);
                  updateProduct('features', newFeatures);
                }}
                className="p-1 text-red-400 hover:text-red-300"
              >
                <FiX size={14} />
              </button>
            </div>
          ))}
          <button
            onClick={() => updateProduct('features', [...(product.features || []), 'New Feature'])}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm text-white"
          >
            <FiPlus size={14} /> Add Feature
          </button>
        </div>
      </details>

      {/* Pricing */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-yellow-400 hover:text-yellow-300 py-2 border-b border-gray-700">
          <span>💰 Pricing</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Regular Price</label>
              <input
                type="number"
                value={product.price || 0}
                onChange={(e) => updateProduct('price', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Sale Price</label>
              <input
                type="number"
                value={product.salePrice || ''}
                onChange={(e) => updateProduct('salePrice', e.target.value ? parseFloat(e.target.value) : 0)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
          </div>
        </div>
      </details>

      {/* Rating */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-orange-400 hover:text-orange-300 py-2 border-b border-gray-700">
          <span>⭐ Rating</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Rating: {product.rating || 0} / 5</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.1"
              value={product.rating || 0}
              onChange={(e) => updateProduct('rating', parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Review Count</label>
            <input
              type="number"
              value={product.reviewCount || 0}
              onChange={(e) => updateProduct('reviewCount', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* CTA Button */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-pink-400 hover:text-pink-300 py-2 border-b border-gray-700">
          <span>🔘 Call to Action</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button Text</label>
            <input
              type="text"
              value={props.ctaText || 'Buy Now'}
              onChange={(e) => onUpdate({ ...props, ctaText: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Secondary Button</label>
            <input
              type="text"
              value={props.secondaryCtaText || 'Learn More'}
              onChange={(e) => onUpdate({ ...props, secondaryCtaText: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>
    </div>
  );
}

// Product Grid Settings - Full editing for product grid
function ProductGridSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);

  const products: ProductData[] = props.products || [];

  const addProduct = () => {
    const newProduct: ProductData = {
      id: `product-${Date.now()}`,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      title: `Product ${products.length + 1}`,
      description: 'Product description',
      price: 49.99,
      salePrice: 0,
      rating: 4.5,
      reviewCount: 50,
      inStock: true,
      badge: '',
      productUrl: `/products/product-${products.length + 1}`,
      quickViewEnabled: true,
    };
    onUpdate({ ...props, products: [...products, newProduct] });
  };

  const updateProduct = (index: number, key: string, value: any) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [key]: value };
    onUpdate({ ...props, products: newProducts });
  };

  const removeProduct = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    onUpdate({ ...props, products: newProducts });
    setExpandedProduct(null);
  };

  const moveProduct = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= products.length) return;
    const newProducts = [...products];
    [newProducts[index], newProducts[newIndex]] = [newProducts[newIndex], newProducts[index]];
    onUpdate({ ...props, products: newProducts });
  };

  return (
    <div className="space-y-4">
      {showImagePicker && editingProductIndex !== null && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => {
            updateProduct(editingProductIndex, 'image', media.path || media.url);
            setShowImagePicker(false);
            setEditingProductIndex(null);
          }}
          onClose={() => { setShowImagePicker(false); setEditingProductIndex(null); }}
        />
      )}

      {/* Layout Options */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700">
          <span>📐 Layout</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Columns</label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map((cols) => (
                <button
                  key={cols}
                  onClick={() => onUpdate({ ...props, columns: cols.toString() })}
                  className={`px-3 py-2 rounded-lg text-sm ${props.columns === cols.toString() ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                >
                  {cols}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Gap</label>
            <select
              value={props.gap || 'medium'}
              onChange={(e) => onUpdate({ ...props, gap: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      </details>

      {/* Display Options */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>👁️ Display Options</span>
        </summary>
        <div className="mt-3 space-y-2">
          {[
            { key: 'showRating', label: 'Show Rating' },
            { key: 'showPrice', label: 'Show Price' },
            { key: 'showBadge', label: 'Show Badges' },
            { key: 'showQuickView', label: 'Enable Quick View' },
            { key: 'showWishlist', label: 'Show Wishlist Button' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={props[key] !== false}
                onChange={(e) => onUpdate({ ...props, [key]: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
              />
              <label className="text-xs text-gray-400">{label}</label>
            </div>
          ))}
        </div>
      </details>

      {/* Products List */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-emerald-400 hover:text-emerald-300 py-2 border-b border-gray-700">
          <span>🛍️ Products ({products.length})</span>
        </summary>
        <div className="mt-3 space-y-2 max-h-80 overflow-y-auto">
          {products.map((product, index) => (
            <div key={product.id || index} className="bg-gray-700/50 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-600/50"
                onClick={() => setExpandedProduct(expandedProduct === index ? null : index)}
              >
                <img src={product.image} alt="" className="w-10 h-10 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{product.title}</p>
                  <p className="text-xs text-gray-400">${product.price?.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => { e.stopPropagation(); moveProduct(index, 'up'); }} className="p-1 hover:bg-gray-600 rounded" disabled={index === 0}>
                    <FiArrowUp size={12} className={index === 0 ? 'text-gray-600' : 'text-gray-400'} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveProduct(index, 'down'); }} className="p-1 hover:bg-gray-600 rounded" disabled={index === products.length - 1}>
                    <FiArrowDown size={12} className={index === products.length - 1 ? 'text-gray-600' : 'text-gray-400'} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); removeProduct(index); }} className="p-1 hover:bg-red-600 rounded">
                    <FiTrash2 size={12} className="text-red-400" />
                  </button>
                </div>
              </div>

              {expandedProduct === index && (
                <div className="p-3 border-t border-gray-600 space-y-3">
                  <button
                    onClick={() => { setEditingProductIndex(index); setShowImagePicker(true); }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm text-white"
                  >
                    <FiImage size={14} /> Change Image
                  </button>
                  <input
                    type="text"
                    value={product.title}
                    onChange={(e) => updateProduct(index, 'title', e.target.value)}
                    placeholder="Product Title"
                    className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-sm text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      className="px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-sm text-white"
                    />
                    <input
                      type="number"
                      value={product.salePrice || ''}
                      onChange={(e) => updateProduct(index, 'salePrice', e.target.value ? parseFloat(e.target.value) : 0)}
                      placeholder="Sale Price"
                      className="px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-sm text-white"
                    />
                  </div>
                  <input
                    type="text"
                    value={product.badge || ''}
                    onChange={(e) => updateProduct(index, 'badge', e.target.value)}
                    placeholder="Badge (Sale, New...)"
                    className="w-full px-2 py-1.5 bg-gray-600 border border-gray-500 rounded text-sm text-white"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={product.inStock !== false}
                      onChange={(e) => updateProduct(index, 'inStock', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700"
                    />
                    <label className="text-xs text-gray-400">In Stock</label>
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            onClick={addProduct}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
          >
            <FiPlus size={14} /> Add Product
          </button>
        </div>
      </details>
    </div>
  );
}

// Product Carousel Settings - Same as grid but with carousel options
function ProductCarouselSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(null);

  const products: ProductData[] = props.products || [];

  const addProduct = () => {
    const newProduct: ProductData = {
      id: `product-${Date.now()}`,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      title: `Product ${products.length + 1}`,
      price: 49.99,
      rating: 4.5,
      reviewCount: 50,
      inStock: true,
      productUrl: `/products/product-${products.length + 1}`,
    };
    onUpdate({ ...props, products: [...products, newProduct] });
  };

  const updateProduct = (index: number, key: string, value: any) => {
    const newProducts = [...products];
    newProducts[index] = { ...newProducts[index], [key]: value };
    onUpdate({ ...props, products: newProducts });
  };

  const removeProduct = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    onUpdate({ ...props, products: newProducts });
  };

  return (
    <div className="space-y-4">
      {showImagePicker && editingProductIndex !== null && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => {
            updateProduct(editingProductIndex, 'image', media.path || media.url);
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {/* Carousel Options */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700">
          <span>🎠 Carousel Options</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Items per View</label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => onUpdate({ ...props, itemsPerView: num })}
                  className={`px-3 py-2 rounded-lg text-sm ${props.itemsPerView === num ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {[
              { key: 'autoplay', label: 'Autoplay' },
              { key: 'showArrows', label: 'Show Navigation Arrows' },
              { key: 'showDots', label: 'Show Pagination Dots' },
              { key: 'loop', label: 'Infinite Loop' },
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={props[key] !== false}
                  onChange={(e) => onUpdate({ ...props, [key]: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
                />
                <label className="text-xs text-gray-400">{label}</label>
              </div>
            ))}
          </div>
          {props.autoplay !== false && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Autoplay Speed (seconds)</label>
              <input
                type="number"
                value={props.autoplaySpeed || 3}
                onChange={(e) => onUpdate({ ...props, autoplaySpeed: parseInt(e.target.value) || 3 })}
                min="1"
                max="10"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
          )}
        </div>
      </details>

      {/* Products List */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-emerald-400 hover:text-emerald-300 py-2 border-b border-gray-700">
          <span>🛍️ Products ({products.length})</span>
        </summary>
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
          {products.map((product, index) => (
            <div key={product.id || index} className="bg-gray-700/50 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-600/50"
                onClick={() => setExpandedProduct(expandedProduct === index ? null : index)}
              >
                <img src={product.image} alt="" className="w-8 h-8 object-cover rounded" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{product.title}</p>
                  <p className="text-xs text-gray-400">${product.price?.toFixed(2)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeProduct(index); }} className="p-1 hover:bg-red-600 rounded">
                  <FiTrash2 size={12} className="text-red-400" />
                </button>
              </div>

              {expandedProduct === index && (
                <div className="p-3 border-t border-gray-600 space-y-2">
                  <button
                    onClick={() => { setEditingProductIndex(index); setShowImagePicker(true); }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded text-sm text-white"
                  >
                    <FiImage size={12} /> Change Image
                  </button>
                  <input
                    type="text"
                    value={product.title}
                    onChange={(e) => updateProduct(index, 'title', e.target.value)}
                    placeholder="Title"
                    className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                    />
                    <input
                      type="number"
                      value={product.salePrice || ''}
                      onChange={(e) => updateProduct(index, 'salePrice', e.target.value ? parseFloat(e.target.value) : 0)}
                      placeholder="Sale"
                      className="px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
          <button
            onClick={addProduct}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
          >
            <FiPlus size={14} /> Add Product
          </button>
        </div>
      </details>
    </div>
  );
}

// Shopping Cart Settings
function ShoppingCartSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  return (
    <div className="space-y-4">
      {/* Cart Style */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-emerald-400 hover:text-emerald-300 py-2 border-b border-gray-700">
          <span>🛒 Cart Style</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Display Style</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'mini', label: 'Mini', icon: '🔽' },
                { value: 'full', label: 'Full', icon: '📋' },
                { value: 'sidebar', label: 'Sidebar', icon: '📑' },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => onUpdate({ ...props, style: value })}
                  className={`px-3 py-2 rounded-lg text-sm flex flex-col items-center gap-1 ${props.style === value ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>

      {/* Cart Options */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>⚙️ Cart Options</span>
        </summary>
        <div className="mt-3 space-y-2">
          {[
            { key: 'showCheckoutButton', label: 'Show Checkout Button' },
            { key: 'showQuantityControls', label: 'Show Quantity Controls' },
            { key: 'showRemoveButton', label: 'Show Remove Button' },
            { key: 'showSubtotal', label: 'Show Subtotal' },
            { key: 'showTax', label: 'Show Tax' },
            { key: 'showShipping', label: 'Show Shipping' },
            { key: 'showPromoCode', label: 'Show Promo Code Field' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={props[key] !== false}
                onChange={(e) => onUpdate({ ...props, [key]: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
              />
              <label className="text-xs text-gray-400">{label}</label>
            </div>
          ))}
        </div>
      </details>

      {/* Button Text */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-pink-400 hover:text-pink-300 py-2 border-b border-gray-700">
          <span>🔘 Button Text</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Checkout Button Text</label>
            <input
              type="text"
              value={props.checkoutText || 'Proceed to Checkout'}
              onChange={(e) => onUpdate({ ...props, checkoutText: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Continue Shopping Text</label>
            <input
              type="text"
              value={props.continueText || 'Continue Shopping'}
              onChange={(e) => onUpdate({ ...props, continueText: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      <p className="text-xs text-gray-500 italic">Cart items are populated dynamically from the shop.</p>
    </div>
  );
}

// Product Categories Settings
function ProductCategoriesSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [editingCategoryIndex, setEditingCategoryIndex] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const categories = props.categories || [];

  const addCategory = () => {
    const newCategory = {
      id: `cat-${Date.now()}`,
      name: `Category ${categories.length + 1}`,
      slug: `category-${categories.length + 1}`,
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
      productCount: 0,
      description: '',
    };
    onUpdate({ ...props, categories: [...categories, newCategory] });
  };

  const updateCategory = (index: number, key: string, value: any) => {
    const newCategories = [...categories];
    newCategories[index] = { ...newCategories[index], [key]: value };
    onUpdate({ ...props, categories: newCategories });
  };

  const removeCategory = (index: number) => {
    const newCategories = categories.filter((_: any, i: number) => i !== index);
    onUpdate({ ...props, categories: newCategories });
  };

  return (
    <div className="space-y-4">
      {showImagePicker && editingCategoryIndex !== null && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => {
            updateCategory(editingCategoryIndex, 'image', media.path || media.url);
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {/* Layout */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700">
          <span>📐 Layout</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Columns</label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map((cols) => (
                <button
                  key={cols}
                  onClick={() => onUpdate({ ...props, columns: cols.toString() })}
                  className={`px-3 py-2 rounded-lg text-sm ${props.columns === cols.toString() ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                >
                  {cols}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-2">Style</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'cards', label: 'Cards' },
                { value: 'overlay', label: 'Overlay' },
                { value: 'minimal', label: 'Minimal' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onUpdate({ ...props, style: value })}
                  className={`px-3 py-2 rounded-lg text-sm ${props.style === value ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>

      {/* Display Options */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>👁️ Display Options</span>
        </summary>
        <div className="mt-3 space-y-2">
          {[
            { key: 'showImage', label: 'Show Category Image' },
            { key: 'showCount', label: 'Show Product Count' },
            { key: 'showDescription', label: 'Show Description' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={props[key] !== false}
                onChange={(e) => onUpdate({ ...props, [key]: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
              />
              <label className="text-xs text-gray-400">{label}</label>
            </div>
          ))}
        </div>
      </details>

      {/* Categories List */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-emerald-400 hover:text-emerald-300 py-2 border-b border-gray-700">
          <span>📂 Categories ({categories.length})</span>
        </summary>
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
          {categories.map((category: any, index: number) => (
            <div key={category.id || index} className="bg-gray-700/50 rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-gray-600/50"
                onClick={() => setExpandedCategory(expandedCategory === index ? null : index)}
              >
                {category.image && <img src={category.image} alt="" className="w-8 h-8 object-cover rounded" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{category.name}</p>
                  <p className="text-xs text-gray-400">{category.productCount || 0} products</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); removeCategory(index); }} className="p-1 hover:bg-red-600 rounded">
                  <FiTrash2 size={12} className="text-red-400" />
                </button>
              </div>

              {expandedCategory === index && (
                <div className="p-3 border-t border-gray-600 space-y-2">
                  <button
                    onClick={() => { setEditingCategoryIndex(index); setShowImagePicker(true); }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded text-sm text-white"
                  >
                    <FiImage size={12} /> Change Image
                  </button>
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => updateCategory(index, 'name', e.target.value)}
                    placeholder="Category Name"
                    className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                  />
                  <textarea
                    value={category.description || ''}
                    onChange={(e) => updateCategory(index, 'description', e.target.value)}
                    placeholder="Description"
                    rows={2}
                    className="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-xs text-white"
                  />
                </div>
              )}
            </div>
          ))}
          <button
            onClick={addCategory}
            className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
          >
            <FiPlus size={14} /> Add Category
          </button>
        </div>
      </details>
    </div>
  );
}

// Product Filter Settings
function ProductFilterSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  return (
    <div className="space-y-4">
      {/* Filter Options */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700">
          <span>🔍 Filter Options</span>
        </summary>
        <div className="mt-3 space-y-2">
          {[
            { key: 'showPriceRange', label: 'Show Price Range' },
            { key: 'showCategories', label: 'Show Categories' },
            { key: 'showRating', label: 'Show Rating Filter' },
            { key: 'showSort', label: 'Show Sort Options' },
            { key: 'showAvailability', label: 'Show Availability Filter' },
            { key: 'showBrands', label: 'Show Brands Filter' },
            { key: 'showColors', label: 'Show Color Filter' },
            { key: 'showSizes', label: 'Show Size Filter' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={props[key] !== false}
                onChange={(e) => onUpdate({ ...props, [key]: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500"
              />
              <label className="text-xs text-gray-400">{label}</label>
            </div>
          ))}
        </div>
      </details>

      {/* Price Range */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-yellow-400 hover:text-yellow-300 py-2 border-b border-gray-700">
          <span>💰 Price Range</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Min Price</label>
              <input
                type="number"
                value={props.priceMin || 0}
                onChange={(e) => onUpdate({ ...props, priceMin: parseInt(e.target.value) || 0 })}
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Max Price</label>
              <input
                type="number"
                value={props.priceMax || 1000}
                onChange={(e) => onUpdate({ ...props, priceMax: parseInt(e.target.value) || 1000 })}
                min="0"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
          </div>
        </div>
      </details>

      {/* Layout */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>📐 Layout</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Filter Style</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'sidebar', label: 'Sidebar' },
                { value: 'horizontal', label: 'Horizontal' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onUpdate({ ...props, filterStyle: value })}
                  className={`px-3 py-2 rounded-lg text-sm ${props.filterStyle === value ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.collapsible !== false}
              onChange={(e) => onUpdate({ ...props, collapsible: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <label className="text-xs text-gray-400">Collapsible Sections</label>
          </div>
        </div>
      </details>
    </div>
  );
}

// Checkout Summary Settings
function CheckoutSummarySettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  return (
    <div className="space-y-4">
      {/* Display Options */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-emerald-400 hover:text-emerald-300 py-2 border-b border-gray-700">
          <span>📋 Display Options</span>
        </summary>
        <div className="mt-3 space-y-2">
          {[
            { key: 'showItems', label: 'Show Order Items' },
            { key: 'showImages', label: 'Show Product Images' },
            { key: 'showQuantity', label: 'Show Quantity' },
            { key: 'showSubtotal', label: 'Show Subtotal' },
            { key: 'showTax', label: 'Show Tax' },
            { key: 'showShipping', label: 'Show Shipping' },
            { key: 'showDiscount', label: 'Show Discount' },
            { key: 'showTotal', label: 'Show Total' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={props[key] !== false}
                onChange={(e) => onUpdate({ ...props, [key]: e.target.checked })}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500"
              />
              <label className="text-xs text-gray-400">{label}</label>
            </div>
          ))}
        </div>
      </details>

      {/* Coupon Field */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-yellow-400 hover:text-yellow-300 py-2 border-b border-gray-700">
          <span>🎟️ Coupon/Promo</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showCoupon !== false}
              onChange={(e) => onUpdate({ ...props, showCoupon: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-500"
            />
            <label className="text-xs text-gray-400">Show Coupon Field</label>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Coupon Placeholder</label>
            <input
              type="text"
              value={props.couponPlaceholder || 'Enter promo code'}
              onChange={(e) => onUpdate({ ...props, couponPlaceholder: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Labels */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>🏷️ Labels</span>
        </summary>
        <div className="mt-3 space-y-3">
          {[
            { key: 'subtotalLabel', label: 'Subtotal Label', default: 'Subtotal' },
            { key: 'taxLabel', label: 'Tax Label', default: 'Tax' },
            { key: 'shippingLabel', label: 'Shipping Label', default: 'Shipping' },
            { key: 'totalLabel', label: 'Total Label', default: 'Total' },
          ].map(({ key, label, default: defaultValue }) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input
                type="text"
                value={props[key] || defaultValue}
                onChange={(e) => onUpdate({ ...props, [key]: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
          ))}
        </div>
      </details>

      <p className="text-xs text-gray-500 italic">Order details are populated from the cart.</p>
    </div>
  );
}

// Sale Banner Settings
function SaleBannerSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [showImagePicker, setShowImagePicker] = useState(false);

  return (
    <div className="space-y-4">
      {showImagePicker && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => {
            onUpdate({ ...props, backgroundImage: media.path || media.url });
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {/* Content */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-pink-400 hover:text-pink-300 py-2 border-b border-gray-700">
          <span>📝 Banner Content</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) => onUpdate({ ...props, title: e.target.value })}
              placeholder="Big Sale!"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subtitle</label>
            <input
              type="text"
              value={props.subtitle || ''}
              onChange={(e) => onUpdate({ ...props, subtitle: e.target.value })}
              placeholder="Limited time offer"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Discount Text</label>
              <input
                type="text"
                value={props.discountText || ''}
                onChange={(e) => onUpdate({ ...props, discountText: e.target.value })}
                placeholder="50% OFF"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Discount Code</label>
              <input
                type="text"
                value={props.discountCode || ''}
                onChange={(e) => onUpdate({ ...props, discountCode: e.target.value })}
                placeholder="SAVE50"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
          </div>
        </div>
      </details>

      {/* CTA Button */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>🔘 Call to Action</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button Text</label>
            <input
              type="text"
              value={props.ctaText || ''}
              onChange={(e) => onUpdate({ ...props, ctaText: e.target.value })}
              placeholder="Shop Now"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Button URL</label>
            <input
              type="text"
              value={props.ctaUrl || ''}
              onChange={(e) => onUpdate({ ...props, ctaUrl: e.target.value })}
              placeholder="/shop/sale"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Countdown Timer */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-yellow-400 hover:text-yellow-300 py-2 border-b border-gray-700">
          <span>⏰ Countdown Timer</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showCountdown !== false}
              onChange={(e) => onUpdate({ ...props, showCountdown: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-500"
            />
            <label className="text-xs text-gray-400">Show Countdown Timer</label>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">End Date</label>
            <input
              type="datetime-local"
              value={props.endDate || ''}
              onChange={(e) => onUpdate({ ...props, endDate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Styling */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-purple-400 hover:text-purple-300 py-2 border-b border-gray-700">
          <span>🎨 Styling</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Banner Style</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'full', label: 'Full Width' },
                { value: 'compact', label: 'Compact' },
                { value: 'floating', label: 'Floating' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => onUpdate({ ...props, style: value })}
                  className={`px-3 py-2 rounded-lg text-xs ${props.style === value ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={props.backgroundColor || '#EF4444'}
                onChange={(e) => onUpdate({ ...props, backgroundColor: e.target.value })}
                className="w-10 h-10 rounded border-0 cursor-pointer"
              />
              <input
                type="text"
                value={props.backgroundColor || '#EF4444'}
                onChange={(e) => onUpdate({ ...props, backgroundColor: e.target.value })}
                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
              />
            </div>
          </div>
          <button
            onClick={() => setShowImagePicker(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-sm text-white"
          >
            <FiImage size={14} /> Set Background Image
          </button>
          {props.backgroundImage && (
            <div className="relative">
              <img src={props.backgroundImage} alt="" className="w-full h-20 object-cover rounded" />
              <button
                onClick={() => onUpdate({ ...props, backgroundImage: '' })}
                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white"
              >
                <FiX size={12} />
              </button>
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

// Audio Block Settings - Full media picker for audio files
function AudioBlockSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [showAudioPicker, setShowAudioPicker] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  return (
    <div className="space-y-4">
      {/* Audio File */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>🎵 Audio File</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            {props.audioUrl ? (
              <div className="flex-1 p-2 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiMusic className="text-blue-400" size={20} />
                  <span className="text-sm text-gray-300 truncate flex-1">
                    {props.audioUrl.split('/').pop() || 'Audio file'}
                  </span>
                  <button
                    onClick={() => onUpdate({ ...props, audioUrl: '' })}
                    className="text-red-400 hover:text-red-300"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-4 border-2 border-dashed border-gray-600 rounded-lg text-center">
                <FiMusic className="mx-auto text-gray-500 mb-2" size={24} />
                <p className="text-xs text-gray-500">No audio selected</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowAudioPicker(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
          >
            <FiUpload size={14} /> Select from Media Library
          </button>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Or paste audio URL</label>
            <input
              type="text"
              value={props.audioUrl || ''}
              onChange={(e) => onUpdate({ ...props, audioUrl: e.target.value })}
              placeholder="https://example.com/audio.mp3"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Track Info */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>📝 Track Info</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Track Title</label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) => onUpdate({ ...props, title: e.target.value })}
              placeholder="Enter track title"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Artist</label>
            <input
              type="text"
              value={props.artist || ''}
              onChange={(e) => onUpdate({ ...props, artist: e.target.value })}
              placeholder="Enter artist name"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Album</label>
            <input
              type="text"
              value={props.album || ''}
              onChange={(e) => onUpdate({ ...props, album: e.target.value })}
              placeholder="Enter album name"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Album Art */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>🖼️ Album Art</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            {props.albumArt ? (
              <div className="relative">
                <img
                  src={props.albumArt}
                  alt="Album art"
                  className="w-20 h-20 object-cover rounded-lg border border-gray-600"
                />
                <button
                  onClick={() => onUpdate({ ...props, albumArt: '' })}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1"
                >
                  <FiX size={12} />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                <FiImage className="text-gray-500" size={24} />
              </div>
            )}
            <button
              onClick={() => setShowImagePicker(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300"
            >
              <FiUpload size={14} /> Choose Image
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Or paste image URL</label>
            <input
              type="text"
              value={props.albumArt || ''}
              onChange={(e) => onUpdate({ ...props, albumArt: e.target.value })}
              placeholder="https://example.com/album-art.jpg"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Player Options */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>⚙️ Player Options</span>
        </summary>
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.autoplay || false}
              onChange={(e) => onUpdate({ ...props, autoplay: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className="text-xs text-gray-400">Autoplay</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.loop || false}
              onChange={(e) => onUpdate({ ...props, loop: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className="text-xs text-gray-400">Loop</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showWaveform !== false}
              onChange={(e) => onUpdate({ ...props, showWaveform: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className="text-xs text-gray-400">Show Waveform</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showDownload || false}
              onChange={(e) => onUpdate({ ...props, showDownload: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className="text-xs text-gray-400">Show Download Button</span>
          </label>
        </div>
      </details>

      {/* Media Picker Modals */}
      {showAudioPicker && (
        <MediaPickerModal
          type="audio"
          onClose={() => setShowAudioPicker(false)}
          onSelect={(media) => {
            onUpdate({ ...props, audioUrl: media.path || media.url });
            setShowAudioPicker(false);
          }}
        />
      )}
      {showImagePicker && (
        <MediaPickerModal
          type="image"
          onClose={() => setShowImagePicker(false)}
          onSelect={(media) => {
            onUpdate({ ...props, albumArt: media.path || media.url });
            setShowImagePicker(false);
          }}
        />
      )}
    </div>
  );
}

// Video Block Settings - Full media picker for video files
function VideoBlockSettings({ props, onUpdate }: { props: Record<string, any>; onUpdate: (props: Record<string, any>) => void }) {
  const [showVideoPicker, setShowVideoPicker] = useState(false);
  const [showPosterPicker, setShowPosterPicker] = useState(false);

  return (
    <div className="space-y-4">
      {/* Video File */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>🎬 Video File</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            {props.videoUrl ? (
              <div className="flex-1 p-2 bg-gray-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiVideo className="text-blue-400" size={20} />
                  <span className="text-sm text-gray-300 truncate flex-1">
                    {props.videoUrl.split('/').pop() || 'Video file'}
                  </span>
                  <button
                    onClick={() => onUpdate({ ...props, videoUrl: '' })}
                    className="text-red-400 hover:text-red-300"
                  >
                    <FiX size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 p-4 border-2 border-dashed border-gray-600 rounded-lg text-center">
                <FiVideo className="mx-auto text-gray-500 mb-2" size={24} />
                <p className="text-xs text-gray-500">No video selected</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowVideoPicker(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white"
          >
            <FiUpload size={14} /> Select from Media Library
          </button>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Or paste video URL</label>
            <input
              type="text"
              value={props.videoUrl || ''}
              onChange={(e) => onUpdate({ ...props, videoUrl: e.target.value })}
              placeholder="https://example.com/video.mp4"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div className="text-xs text-gray-500">
            <p className="font-medium mb-1">Supported formats:</p>
            <p>MP4, WebM, OGG, YouTube, Vimeo links</p>
          </div>
        </div>
      </details>

      {/* Video Info */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>📝 Video Info</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Video Title</label>
            <input
              type="text"
              value={props.title || ''}
              onChange={(e) => onUpdate({ ...props, title: e.target.value })}
              placeholder="Enter video title"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Description</label>
            <textarea
              value={props.description || ''}
              onChange={(e) => onUpdate({ ...props, description: e.target.value })}
              placeholder="Enter video description"
              rows={2}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white resize-none"
            />
          </div>
        </div>
      </details>

      {/* Poster Image */}
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>🖼️ Poster/Thumbnail</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-2">
            {props.posterUrl ? (
              <div className="relative">
                <img
                  src={props.posterUrl}
                  alt="Video poster"
                  className="w-32 h-20 object-cover rounded-lg border border-gray-600"
                />
                <button
                  onClick={() => onUpdate({ ...props, posterUrl: '' })}
                  className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full p-1"
                >
                  <FiX size={12} />
                </button>
              </div>
            ) : (
              <div className="w-32 h-20 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                <FiImage className="text-gray-500" size={24} />
              </div>
            )}
            <button
              onClick={() => setShowPosterPicker(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300"
            >
              <FiUpload size={14} /> Choose Poster
            </button>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Or paste image URL</label>
            <input
              type="text"
              value={props.posterUrl || ''}
              onChange={(e) => onUpdate({ ...props, posterUrl: e.target.value })}
              placeholder="https://example.com/poster.jpg"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            />
          </div>
        </div>
      </details>

      {/* Player Options */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>⚙️ Player Options</span>
        </summary>
        <div className="mt-3 space-y-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.autoplay || false}
              onChange={(e) => onUpdate({ ...props, autoplay: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className="text-xs text-gray-400">Autoplay</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.loop || false}
              onChange={(e) => onUpdate({ ...props, loop: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className="text-xs text-gray-400">Loop</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.muted || false}
              onChange={(e) => onUpdate({ ...props, muted: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className="text-xs text-gray-400">Start Muted</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.controls !== false}
              onChange={(e) => onUpdate({ ...props, controls: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className="text-xs text-gray-400">Show Controls</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.playsInline !== false}
              onChange={(e) => onUpdate({ ...props, playsInline: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className="text-xs text-gray-400">Play Inline (mobile)</span>
          </label>
        </div>
      </details>

      {/* Aspect Ratio */}
      <details className="group">
        <summary className="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-400 hover:text-blue-300 py-2 border-b border-gray-700">
          <span>📐 Display Options</span>
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Aspect Ratio</label>
            <select
              value={props.aspectRatio || '16:9'}
              onChange={(e) => onUpdate({ ...props, aspectRatio: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="16:9">16:9 (Widescreen)</option>
              <option value="4:3">4:3 (Standard)</option>
              <option value="1:1">1:1 (Square)</option>
              <option value="9:16">9:16 (Vertical/Mobile)</option>
              <option value="21:9">21:9 (Cinematic)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Border Radius</label>
            <select
              value={props.borderRadius || 'rounded-lg'}
              onChange={(e) => onUpdate({ ...props, borderRadius: e.target.value })}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white"
            >
              <option value="rounded-none">None</option>
              <option value="rounded-md">Small</option>
              <option value="rounded-lg">Medium</option>
              <option value="rounded-xl">Large</option>
              <option value="rounded-2xl">Extra Large</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={props.showTitle !== false}
              onChange={(e) => onUpdate({ ...props, showTitle: e.target.checked })}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500"
            />
            <span className="text-xs text-gray-400">Show Title Below Video</span>
          </label>
        </div>
      </details>

      {/* Media Picker Modals */}
      {showVideoPicker && (
        <MediaPickerModal
          type="video"
          onClose={() => setShowVideoPicker(false)}
          onSelect={(media) => {
            onUpdate({ ...props, videoUrl: media.path || media.url });
            setShowVideoPicker(false);
          }}
        />
      )}
      {showPosterPicker && (
        <MediaPickerModal
          type="image"
          onClose={() => setShowPosterPicker(false)}
          onSelect={(media) => {
            onUpdate({ ...props, posterUrl: media.path || media.url });
            setShowPosterPicker(false);
          }}
        />
      )}
    </div>
  );
}

// Type aliases for Course/LMS data (using types from AdvancedBlocks)
type CourseData = AdvancedCourseData;
type ModuleData = AdvancedModuleData;
type CourseCategoryData = AdvancedCourseCategoryData;