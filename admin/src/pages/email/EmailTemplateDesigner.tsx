/**
 * Visual Email Template Designer
 * Beautiful drag-and-drop block-based email template builder with media library integration
 */

import { useState, useCallback, useEffect } from 'react';
import {
  FiType, FiImage, FiSquare, FiMinus, FiLink,
  FiArrowUp, FiArrowDown, FiTrash2, FiCopy, FiSmartphone, FiMonitor,
  FiSave, FiEye, FiX, FiPlus, FiLayout, FiAlignLeft, FiAlignCenter, FiAlignRight,
  FiGrid, FiStar, FiMail, FiCheck, FiSearch, FiColumns, FiHelpCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { emailApi, mediaApi } from '../../services/api';
import Tooltip from '../../components/Tooltip';

// Social Media Platform Data with SVG icons and brand colors
export const SOCIAL_PLATFORMS = {
  facebook: { name: 'Facebook', color: '#1877F2', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>` },
  twitter: { name: 'X (Twitter)', color: '#000000', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>` },
  instagram: { name: 'Instagram', color: '#E4405F', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg>` },
  linkedin: { name: 'LinkedIn', color: '#0A66C2', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>` },
  youtube: { name: 'YouTube', color: '#FF0000', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>` },
  tiktok: { name: 'TikTok', color: '#000000', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>` },
  pinterest: { name: 'Pinterest', color: '#BD081C', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>` },
  snapchat: { name: 'Snapchat', color: '#FFFC00', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/></svg>` },
  discord: { name: 'Discord', color: '#5865F2', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>` },
  whatsapp: { name: 'WhatsApp', color: '#25D366', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>` },
  email: { name: 'Email', color: '#EA4335', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/></svg>` },
  website: { name: 'Website', color: '#4A5568', icon: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1 19.93V18c0-.55-.45-1-1-1H7v-3c0-.55-.45-1-1-1H4V9h2c.55 0 1-.45 1-1V5h3c.55 0 1-.45 1-1V2.07c4.942.513 8.93 4.502 9.93 9.93H20c-.55 0-1 .45-1 1v3h-3c-.55 0-1 .45-1 1v3h-3c-.55 0-1 .45-1 1v.93z"/></svg>` },
} as const;

export type SocialPlatform = keyof typeof SOCIAL_PLATFORMS;

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  enabled: boolean;
}

// Types - Enhanced with all block types
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
    enabled: boolean;
    field: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'exists';
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

interface MediaItem {
  id: string;
  filename: string;
  originalName?: string;
  url?: string;
  path?: string;
  mimeType: string;
}

// Default block configurations - Enhanced with all block types
const DEFAULT_BLOCKS: Record<BlockType, Partial<EmailBlock>> = {
  // === LAYOUT BLOCKS ===
  header: {
    content: { logoUrl: '', title: 'Your Brand' },
    styles: { backgroundColor: '#ffffff', padding: 32, textAlign: 'center' }
  },
  footer: {
    content: { companyName: '{{site.name}}', address: '123 Main St', unsubscribeText: 'Unsubscribe' },
    styles: { backgroundColor: '#1f2937', padding: 40, textAlign: 'center', color: '#9ca3af' }
  },
  divider: {
    content: {},
    styles: { color: '#e5e7eb', thickness: 1, padding: 24 }
  },
  spacer: {
    content: {},
    styles: { height: 40 }
  },
  columns: {
    content: { columns: 2, column1: 'Left column content', column2: 'Right column content', column3: 'Third column content' },
    styles: { backgroundColor: '#ffffff', padding: 24, gap: 16 }
  },
  section: {
    content: { title: 'Section Title', showTitle: true },
    styles: { backgroundColor: '#f9fafb', padding: 32, borderRadius: 12 }
  },

  // === CONTENT BLOCKS ===
  text: {
    content: { text: 'Write your message here.' },
    styles: { backgroundColor: '#ffffff', padding: 24, fontSize: 16, lineHeight: 1.7, textAlign: 'left', color: '#374151' }
  },
  image: {
    content: { src: '', alt: 'Image', link: '' },
    styles: { backgroundColor: '#ffffff', padding: 16, borderRadius: 8 }
  },
  button: {
    content: { text: 'Get Started', link: '#', trackClicks: true },
    styles: { backgroundColor: '#4F46E5', textColor: '#ffffff', padding: 16, borderRadius: 8, fontSize: 16, align: 'center' }
  },
  hero: {
    content: { title: 'Welcome!', subtitle: 'Discover something amazing.', buttonText: 'Get Started', buttonLink: '#', backgroundImage: '' },
    styles: { backgroundColor: '#4F46E5', textColor: '#ffffff', padding: 64, textAlign: 'center', overlay: true, overlayOpacity: 0.5 }
  },
  cta: {
    content: { title: 'Ready?', subtitle: 'Join now.', buttonText: 'Start', buttonLink: '#' },
    styles: { backgroundColor: '#f3f4f6', padding: 48, textAlign: 'center', buttonColor: '#4F46E5', buttonTextColor: '#ffffff' }
  },
  features: {
    content: { title: 'Features', features: [{ icon: '⚡', title: 'Fast', desc: 'Lightning quick performance' }, { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security' }, { icon: '💡', title: 'Smart', desc: 'Intelligent automation' }] },
    styles: { backgroundColor: '#ffffff', padding: 40, columns: 3, iconSize: 32 }
  },
  testimonial: {
    content: { quote: '"This product changed my life! Highly recommended."', author: 'Jane Smith', role: 'CEO, TechCorp', avatar: '', rating: 5 },
    styles: { backgroundColor: '#ffffff', padding: 40, textAlign: 'center', showRating: true, showAvatar: true }
  },
  social: {
    content: { title: 'Follow Us', links: [{ platform: 'facebook', url: 'https://facebook.com/', enabled: true }, { platform: 'twitter', url: 'https://x.com/', enabled: true }, { platform: 'instagram', url: 'https://instagram.com/', enabled: true }] },
    styles: { backgroundColor: '#f9fafb', padding: 32, align: 'center', iconSize: 32, iconSpacing: 12, iconStyle: 'colored' }
  },

  // === E-COMMERCE BLOCKS ===
  productShowcase: {
    content: { productName: 'Amazing Product', productImage: '', price: '$99.99', originalPrice: '$149.99', description: 'Premium quality product with exceptional value.', buttonText: 'Shop Now', buttonLink: '#', badge: 'Best Seller', rating: 4.5, reviewCount: 128 },
    styles: { backgroundColor: '#ffffff', padding: 32, borderRadius: 12, showBadge: true, showRating: true, showOriginalPrice: true, buttonColor: '#4F46E5', accentColor: '#EF4444' }
  },
  productGrid: {
    content: { title: 'Featured Products', products: [{ name: 'Product 1', image: '', price: '$49.99', link: '#' }, { name: 'Product 2', image: '', price: '$59.99', link: '#' }, { name: 'Product 3', image: '', price: '$39.99', link: '#' }, { name: 'Product 4', image: '', price: '$79.99', link: '#' }] },
    styles: { backgroundColor: '#f9fafb', padding: 32, columns: 2, gap: 16, productCardBg: '#ffffff', borderRadius: 8 }
  },
  cartAbandonment: {
    content: { headline: 'You left something behind!', subheadline: 'Your cart is waiting for you.', items: [{ name: 'Product Name', image: '', price: '$99.99', quantity: 1 }], buttonText: 'Complete Your Order', buttonLink: '#', urgencyText: 'Only 3 left!', discountCode: 'COMEBACK10', discountText: 'Use code for 10% off' },
    styles: { backgroundColor: '#ffffff', padding: 32, accentColor: '#EF4444', buttonColor: '#4F46E5', showUrgency: true, showDiscount: true }
  },
  orderConfirmation: {
    content: { headline: 'Order Confirmed! 🎉', orderNumber: '{{order.number}}', orderDate: '{{order.date}}', items: [{ name: 'Product Name', quantity: 1, price: '$99.99' }], subtotal: '{{order.subtotal}}', shipping: '{{order.shipping}}', total: '{{order.total}}', estimatedDelivery: '3-5 business days', trackingLink: '#' },
    styles: { backgroundColor: '#ffffff', padding: 32, accentColor: '#10B981', borderRadius: 12 }
  },
  productRecommendations: {
    content: { title: 'You Might Also Like', subtitle: 'Based on your purchase', products: [{ name: 'Recommended 1', image: '', price: '$49.99', link: '#' }, { name: 'Recommended 2', image: '', price: '$59.99', link: '#' }, { name: 'Recommended 3', image: '', price: '$39.99', link: '#' }] },
    styles: { backgroundColor: '#f9fafb', padding: 32, columns: 3, buttonColor: '#4F46E5' }
  },
  discountCode: {
    content: { headline: 'Special Offer!', description: 'Use this exclusive code', code: 'SAVE20', discount: '20% OFF', expiryText: 'Expires in 48 hours', buttonText: 'Shop Now', buttonLink: '#', terms: 'Valid on orders over $50' },
    styles: { backgroundColor: '#4F46E5', textColor: '#ffffff', padding: 40, codeBackground: '#ffffff', codeColor: '#4F46E5', borderRadius: 12, borderStyle: 'dashed' }
  },
  saleAnnouncement: {
    content: { preheadline: 'Limited Time Only', headline: 'SUMMER SALE', discount: 'UP TO 50% OFF', description: 'Shop our biggest sale of the season.', buttonText: 'Shop the Sale', buttonLink: '#', showCountdown: false },
    styles: { backgroundColor: '#EF4444', textColor: '#ffffff', padding: 48, backgroundImage: '', overlay: true, overlayOpacity: 0.7, textAlign: 'center' }
  },

  // === LMS/COURSE BLOCKS ===
  courseCard: {
    content: { courseTitle: 'Introduction to Web Development', courseImage: '', instructor: 'John Smith', duration: '8 hours', lessons: 24, level: 'Beginner', rating: 4.8, students: 1250, price: '$49.99', description: 'Learn the fundamentals of web development.', buttonText: 'Enroll Now', buttonLink: '#', tags: ['HTML', 'CSS', 'JavaScript'] },
    styles: { backgroundColor: '#ffffff', padding: 24, borderRadius: 16, showRating: true, showInstructor: true, showTags: true, accentColor: '#8B5CF6', buttonColor: '#8B5CF6' }
  },
  lessonProgress: {
    content: { courseTitle: 'Your Course Progress', courseName: 'Introduction to Web Development', completedLessons: 12, totalLessons: 24, percentComplete: 50, currentLesson: 'Working with CSS Grid', nextLesson: 'Responsive Design', timeRemaining: '4 hours', buttonText: 'Continue Learning', buttonLink: '#', streak: 5 },
    styles: { backgroundColor: '#ffffff', padding: 32, progressColor: '#10B981', progressBgColor: '#E5E7EB', showStreak: true, showTimeRemaining: true, borderRadius: 12 }
  },
  certificateAnnouncement: {
    content: { headline: 'Congratulations! 🎓', subheadline: 'You have completed', courseName: 'Introduction to Web Development', studentName: '{{user.name}}', completionDate: '{{completion.date}}', skills: ['HTML5', 'CSS3', 'JavaScript'], buttonText: 'View Certificate', buttonLink: '#', shareText: 'Share your achievement' },
    styles: { backgroundColor: '#1F2937', textColor: '#ffffff', padding: 48, accentColor: '#F59E0B', showSkills: true, textAlign: 'center' }
  },
  achievement: {
    content: { badgeIcon: '🏆', badgeName: 'Fast Learner', description: 'Completed 5 lessons in one day', earnedDate: 'Just now', points: 100, level: 'Gold', shareText: 'Share this achievement' },
    styles: { backgroundColor: '#FEF3C7', borderColor: '#F59E0B', textColor: '#92400E', padding: 24, borderRadius: 16, showPoints: true }
  },
  courseRecommendations: {
    content: { title: 'Continue Your Learning Journey', subtitle: 'Based on your interests', courses: [{ title: 'Advanced JavaScript', image: '', duration: '12 hours', rating: 4.9, link: '#' }, { title: 'React Fundamentals', image: '', duration: '10 hours', rating: 4.8, link: '#' }] },
    styles: { backgroundColor: '#F3F4F6', padding: 32, columns: 2, accentColor: '#8B5CF6' }
  },
  instructorSpotlight: {
    content: { name: 'Dr. Sarah Johnson', avatar: '', title: 'Senior Developer', company: 'Tech Corp', bio: '15+ years experience. Taught over 50,000 students.', courses: 12, students: 50000, rating: 4.9, buttonText: 'View Courses', buttonLink: '#' },
    styles: { backgroundColor: '#ffffff', padding: 32, avatarSize: 100, layout: 'centered', showStats: true, accentColor: '#8B5CF6' }
  },

  // === BLOG/CONTENT BLOCKS ===
  featuredArticle: {
    content: { category: 'Technology', title: 'The Future of AI in Web Development', excerpt: 'Discover how artificial intelligence is revolutionizing the way we build websites.', image: '', author: 'Jane Smith', authorAvatar: '', publishDate: 'January 8, 2026', readTime: '5 min read', buttonText: 'Read Article', buttonLink: '#' },
    styles: { backgroundColor: '#ffffff', padding: 0, borderRadius: 16, imageHeight: 240, showCategory: true, showAuthor: true, showReadTime: true, categoryColor: '#8B5CF6' }
  },
  blogSummary: {
    content: { category: 'Tutorial', title: 'Getting Started with Next.js', excerpt: 'A comprehensive guide to building modern React applications.', image: '', publishDate: 'January 7, 2026', readTime: '8 min', buttonText: 'Continue Reading →', buttonLink: '#' },
    styles: { backgroundColor: '#ffffff', padding: 24, borderRadius: 12, showImage: true, imagePosition: 'left', imageWidth: 120 }
  },
  authorBio: {
    content: { name: 'Sarah Williams', avatar: '', role: 'Senior Tech Writer', bio: 'Sarah has been writing about technology for over 10 years.', email: 'sarah@example.com', website: '', articleCount: 45, buttonText: 'View All Articles', buttonLink: '#' },
    styles: { backgroundColor: '#F9FAFB', padding: 32, borderRadius: 16, avatarSize: 80, layout: 'horizontal', showArticleCount: true, accentColor: '#4F46E5' }
  },
  relatedPosts: {
    content: { title: 'You Might Also Enjoy', posts: [{ title: 'Building Responsive Layouts', category: 'CSS', image: '', link: '#', readTime: '4 min' }, { title: 'JavaScript Best Practices', category: 'JavaScript', image: '', link: '#', readTime: '6 min' }] },
    styles: { backgroundColor: '#ffffff', padding: 32, columns: 2, showImages: true, showCategory: true, accentColor: '#4F46E5' }
  },
  newsletterSignup: {
    content: { headline: 'Stay Updated', subheadline: 'Get the latest articles delivered to your inbox.', placeholder: 'Enter your email', buttonText: 'Subscribe', privacyText: 'We respect your privacy.', incentive: 'Free ebook!', showIncentive: true, frequency: 'Weekly digest' },
    styles: { backgroundColor: '#4F46E5', textColor: '#ffffff', padding: 48, borderRadius: 16, inputStyle: 'pill', buttonColor: '#ffffff', buttonTextColor: '#4F46E5' }
  },

  // === INTERACTIVE BLOCKS ===
  countdown: {
    content: { headline: 'Sale Ends In', endDate: '', expiredText: 'This offer has expired', labels: { days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' }, buttonText: 'Shop Now', buttonLink: '#', showButton: true },
    styles: { backgroundColor: '#EF4444', textColor: '#ffffff', padding: 40, timerStyle: 'boxes', boxColor: '#ffffff', boxTextColor: '#EF4444', fontSize: 'large', textAlign: 'center' }
  },
  progressBar: {
    content: { title: 'Campaign Progress', current: 75, goal: 100, unit: '%', description: '75% of our goal reached!', showPercentage: true, showNumbers: false },
    styles: { backgroundColor: '#ffffff', padding: 32, progressColor: '#10B981', trackColor: '#E5E7EB', height: 12, borderRadius: 6, animated: true }
  },
  rating: {
    content: { title: 'How would you rate your experience?', subtitle: 'Click a star to rate', currentRating: 0, maxRating: 5, ratingLabels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'], showLabels: true, feedbackUrl: '#' },
    styles: { backgroundColor: '#ffffff', padding: 32, starColor: '#F59E0B', starEmptyColor: '#D1D5DB', starSize: 40, textAlign: 'center' }
  },
  videoEmbed: {
    content: { thumbnailUrl: '', videoUrl: '', title: 'Watch Our Latest Video', description: 'Click to play', duration: '3:45', playButtonText: 'Watch Now', platform: 'youtube' },
    styles: { backgroundColor: '#000000', padding: 0, borderRadius: 12, aspectRatio: '16:9', showPlayButton: true, playButtonColor: '#EF4444', overlayOpacity: 0.3 }
  },
  imageGallery: {
    content: { title: 'Gallery', images: [{ url: '', alt: 'Image 1', caption: '' }, { url: '', alt: 'Image 2', caption: '' }, { url: '', alt: 'Image 3', caption: '' }, { url: '', alt: 'Image 4', caption: '' }] },
    styles: { backgroundColor: '#ffffff', padding: 24, columns: 2, gap: 12, borderRadius: 8, showCaptions: false, aspectRatio: 'square' }
  },

  // === ADVANCED LAYOUT BLOCKS ===
  accordion: {
    content: { title: 'Frequently Asked Questions', items: [{ question: 'How do I get started?', answer: 'Simply sign up for an account and follow our guide.' }, { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards and PayPal.' }], defaultOpen: 0 },
    styles: { backgroundColor: '#ffffff', padding: 32, itemBorderColor: '#E5E7EB', questionColor: '#1F2937', answerColor: '#6B7280', iconColor: '#4F46E5', borderRadius: 8 }
  },
  tabs: {
    content: { tabs: [{ label: 'Tab 1', content: 'Content for tab 1' }, { label: 'Tab 2', content: 'Content for tab 2' }], activeTab: 0 },
    styles: { backgroundColor: '#ffffff', padding: 24, tabColor: '#4F46E5', tabBgColor: '#E5E7EB', activeTabBg: '#4F46E5', activeTabColor: '#ffffff' }
  },
  iconList: {
    content: { title: "What's Included", items: [{ icon: '✓', text: 'Unlimited access to all features', highlight: false }, { icon: '✓', text: 'Priority customer support', highlight: false }, { icon: '✓', text: '30-day money-back guarantee', highlight: true }] },
    styles: { backgroundColor: '#ffffff', padding: 32, iconColor: '#10B981', iconBgColor: '#D1FAE5', textColor: '#374151', highlightColor: '#4F46E5', iconSize: 24, spacing: 16 }
  },
  statsGrid: {
    content: { title: 'By The Numbers', stats: [{ value: '10K+', label: 'Happy Customers', icon: '👥' }, { value: '99%', label: 'Satisfaction Rate', icon: '⭐' }, { value: '24/7', label: 'Support Available', icon: '💬' }, { value: '50+', label: 'Countries Served', icon: '🌍' }] },
    styles: { backgroundColor: '#4F46E5', textColor: '#ffffff', padding: 40, columns: 4, showIcons: true, statValueSize: 36, labelSize: 14 }
  }
};

const BLOCK_CATEGORIES: Record<string, BlockType[]> = {
  'Layout': ['header', 'footer', 'divider', 'spacer', 'columns', 'section'],
  'Content': ['text', 'image', 'button', 'hero', 'cta'],
  'Marketing': ['features', 'testimonial', 'social', 'statsGrid'],
  'E-commerce': ['productShowcase', 'productGrid', 'cartAbandonment', 'orderConfirmation', 'productRecommendations', 'discountCode', 'saleAnnouncement'],
  'Courses': ['courseCard', 'lessonProgress', 'certificateAnnouncement', 'achievement', 'courseRecommendations', 'instructorSpotlight'],
  'Blog': ['featuredArticle', 'blogSummary', 'authorBio', 'relatedPosts', 'newsletterSignup'],
  'Interactive': ['countdown', 'progressBar', 'rating', 'videoEmbed', 'imageGallery'],
  'Advanced': ['accordion', 'tabs', 'iconList']
};

const BLOCK_INFO: Record<BlockType, { label: string; icon: any; description?: string }> = {
  // Layout
  header: { label: 'Header', icon: FiLayout, description: 'Logo and brand header' },
  footer: { label: 'Footer', icon: FiLayout, description: 'Footer with links' },
  divider: { label: 'Divider', icon: FiMinus, description: 'Horizontal separator' },
  spacer: { label: 'Spacer', icon: FiGrid, description: 'Vertical spacing' },
  columns: { label: 'Columns', icon: FiColumns, description: 'Multi-column layout' },
  section: { label: 'Section', icon: FiLayout, description: 'Grouped content' },
  // Content
  text: { label: 'Text', icon: FiType, description: 'Rich text content' },
  image: { label: 'Image', icon: FiImage, description: 'Single image' },
  button: { label: 'Button', icon: FiSquare, description: 'CTA button' },
  hero: { label: 'Hero', icon: FiStar, description: 'Hero banner' },
  cta: { label: 'CTA', icon: FiMail, description: 'Call to action' },
  features: { label: 'Features', icon: FiCheck, description: 'Feature list' },
  testimonial: { label: 'Testimonial', icon: FiStar, description: 'Customer quote' },
  social: { label: 'Social', icon: FiLink, description: 'Social icons' },
  // E-commerce
  productShowcase: { label: 'Product', icon: FiSquare, description: 'Featured product' },
  productGrid: { label: 'Products', icon: FiGrid, description: 'Product grid' },
  cartAbandonment: { label: 'Cart', icon: FiSquare, description: 'Abandoned cart' },
  orderConfirmation: { label: 'Order', icon: FiCheck, description: 'Order summary' },
  productRecommendations: { label: 'Recs', icon: FiStar, description: 'Recommendations' },
  discountCode: { label: 'Discount', icon: FiSquare, description: 'Promo code' },
  saleAnnouncement: { label: 'Sale', icon: FiStar, description: 'Sale banner' },
  // Courses
  courseCard: { label: 'Course', icon: FiLayout, description: 'Course card' },
  lessonProgress: { label: 'Progress', icon: FiLayout, description: 'Lesson progress' },
  certificateAnnouncement: { label: 'Certificate', icon: FiStar, description: 'Certificate earned' },
  achievement: { label: 'Achievement', icon: FiStar, description: 'Badge earned' },
  courseRecommendations: { label: 'Courses', icon: FiGrid, description: 'Course suggestions' },
  instructorSpotlight: { label: 'Instructor', icon: FiLayout, description: 'Instructor bio' },
  // Blog
  featuredArticle: { label: 'Article', icon: FiLayout, description: 'Featured post' },
  blogSummary: { label: 'Post', icon: FiType, description: 'Blog summary' },
  authorBio: { label: 'Author', icon: FiLayout, description: 'Author info' },
  relatedPosts: { label: 'Related', icon: FiGrid, description: 'Related posts' },
  newsletterSignup: { label: 'Newsletter', icon: FiMail, description: 'Email signup' },
  // Interactive
  countdown: { label: 'Countdown', icon: FiLayout, description: 'Timer' },
  progressBar: { label: 'Progress', icon: FiLayout, description: 'Progress bar' },
  rating: { label: 'Rating', icon: FiStar, description: 'Star rating' },
  videoEmbed: { label: 'Video', icon: FiLayout, description: 'Video embed' },
  imageGallery: { label: 'Gallery', icon: FiImage, description: 'Image grid' },
  // Advanced
  accordion: { label: 'FAQ', icon: FiLayout, description: 'Expandable' },
  tabs: { label: 'Tabs', icon: FiColumns, description: 'Tabbed content' },
  iconList: { label: 'Icon List', icon: FiCheck, description: 'List with icons' },
  statsGrid: { label: 'Stats', icon: FiGrid, description: 'Statistics' }
};

// Block tooltips for user guidance
const BLOCK_TOOLTIPS: Record<BlockType, { title: string; content: string; example?: string }> = {
  // Layout
  header: { title: '📌 Header', content: 'Company logo and brand name.', example: 'Brand identity' },
  footer: { title: '🦶 Footer', content: 'Company info and unsubscribe.', example: 'Legal info' },
  divider: { title: '➖ Divider', content: 'Horizontal separator line.', example: 'Visual separation' },
  spacer: { title: '↕️ Spacer', content: 'Vertical spacing.', example: 'Breathing room' },
  columns: { title: '📊 Columns', content: 'Multi-column layout.', example: 'Side-by-side content' },
  section: { title: '📦 Section', content: 'Group related content.', example: 'Organized sections' },
  // Content
  text: { title: '✏️ Text', content: 'Rich text content.', example: 'Messages, descriptions' },
  image: { title: '🖼️ Image', content: 'Insert images.', example: 'Photos, banners' },
  button: { title: '🔘 Button', content: 'Call-to-action button.', example: 'CTAs, links' },
  hero: { title: '⭐ Hero', content: 'Eye-catching banner.', example: 'Announcements' },
  cta: { title: '📣 CTA', content: 'Call-to-action section.', example: 'Conversions' },
  features: { title: '✨ Features', content: 'Feature grid layout.', example: 'Product benefits' },
  testimonial: { title: '💬 Testimonial', content: 'Customer quote.', example: 'Social proof' },
  social: { title: '🔗 Social', content: 'Social media icons.', example: 'Community building' },
  // E-commerce
  productShowcase: { title: '🛍️ Product', content: 'Featured product display.', example: 'Product highlight' },
  productGrid: { title: '📦 Products', content: 'Multiple products grid.', example: 'Product collection' },
  cartAbandonment: { title: '🛒 Cart', content: 'Abandoned cart reminder.', example: 'Cart recovery' },
  orderConfirmation: { title: '✅ Order', content: 'Order confirmation details.', example: 'Purchase receipt' },
  productRecommendations: { title: '💡 Recommendations', content: 'Suggested products.', example: 'Cross-sell' },
  discountCode: { title: '🎟️ Discount', content: 'Promo code display.', example: 'Special offers' },
  saleAnnouncement: { title: '🏷️ Sale', content: 'Sale announcement.', example: 'Promotions' },
  // Courses
  courseCard: { title: '📚 Course', content: 'Course preview card.', example: 'Course promotion' },
  lessonProgress: { title: '📈 Progress', content: 'Learning progress.', example: 'Student engagement' },
  certificateAnnouncement: { title: '🎓 Certificate', content: 'Completion certificate.', example: 'Achievement' },
  achievement: { title: '🏆 Achievement', content: 'Badge or reward.', example: 'Gamification' },
  courseRecommendations: { title: '📖 Courses', content: 'Suggested courses.', example: 'Learning path' },
  instructorSpotlight: { title: '👨‍🏫 Instructor', content: 'Instructor profile.', example: 'Teacher bio' },
  // Blog
  featuredArticle: { title: '📰 Article', content: 'Featured blog post.', example: 'Content highlight' },
  blogSummary: { title: '📝 Post', content: 'Blog post summary.', example: 'Article preview' },
  authorBio: { title: '✍️ Author', content: 'Author information.', example: 'Writer profile' },
  relatedPosts: { title: '🔗 Related', content: 'Related articles.', example: 'More content' },
  newsletterSignup: { title: '📬 Newsletter', content: 'Email subscription.', example: 'List building' },
  // Interactive
  countdown: { title: '⏰ Countdown', content: 'Timer countdown.', example: 'Urgency' },
  progressBar: { title: '📊 Progress', content: 'Progress indicator.', example: 'Goal tracking' },
  rating: { title: '⭐ Rating', content: 'Star rating.', example: 'Feedback' },
  videoEmbed: { title: '🎬 Video', content: 'Video thumbnail.', example: 'Media content' },
  imageGallery: { title: '🖼️ Gallery', content: 'Image gallery.', example: 'Visual showcase' },
  // Advanced
  accordion: { title: '📋 FAQ', content: 'Expandable sections.', example: 'Q&A' },
  tabs: { title: '📑 Tabs', content: 'Tabbed content.', example: 'Organized info' },
  iconList: { title: '✓ Icon List', content: 'List with icons.', example: 'Features, benefits' },
  statsGrid: { title: '📈 Stats', content: 'Statistics display.', example: 'Numbers, metrics' }
};

const FONTS = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'Verdana, sans-serif', label: 'Verdana' },
];

const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const createBlock = (type: BlockType): EmailBlock => ({
  id: generateId(),
  type,
  content: { ...DEFAULT_BLOCKS[type].content },
  styles: { ...DEFAULT_BLOCKS[type].styles }
});

const DEFAULT_DESIGN: EmailDesign = {
  blocks: [],
  globalStyles: {
    backgroundColor: '#f3f4f6',
    contentWidth: 600,
    fontFamily: 'Arial, sans-serif',
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    textColor: '#333333',
    linkColor: '#4F46E5',
    borderRadius: 8
  }
};

// Pre-built professional templates
const TEMPLATE_PRESETS = [
  { id: 'ecom-welcome', name: 'Welcome Series', category: 'ecommerce', description: 'Welcome new customers', icon: '🛒' },
  { id: 'ecom-cart', name: 'Abandoned Cart', category: 'ecommerce', description: 'Recover abandoned carts', icon: '🛒' },
  { id: 'ecom-order', name: 'Order Confirmation', category: 'ecommerce', description: 'Order receipts', icon: '🛒' },
  { id: 'ecom-sale', name: 'Sale Announcement', category: 'ecommerce', description: 'Promote sales', icon: '🛒' },
  { id: 'edu-enroll', name: 'Course Enrollment', category: 'education', description: 'Welcome students', icon: '🎓' },
  { id: 'edu-progress', name: 'Progress Update', category: 'education', description: 'Learning progress', icon: '🎓' },
  { id: 'edu-cert', name: 'Certificate', category: 'education', description: 'Completion certificate', icon: '🎓' },
  { id: 'blog-newsletter', name: 'Newsletter', category: 'blog', description: 'Content digest', icon: '📝' },
  { id: 'blog-post', name: 'New Post', category: 'blog', description: 'Article notification', icon: '📝' },
  { id: 'saas-onboard', name: 'Onboarding', category: 'saas', description: 'User onboarding', icon: '💻' },
  { id: 'saas-feature', name: 'Feature Update', category: 'saas', description: 'Announce features', icon: '💻' },
  { id: 'saas-usage', name: 'Usage Report', category: 'saas', description: 'Monthly stats', icon: '💻' },
];

export default function EmailTemplateDesigner() {
  const [design, setDesign] = useState<EmailDesign>(DEFAULT_DESIGN);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [mediaTarget, setMediaTarget] = useState<{ blockId: string; field: string } | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateSlug, setTemplateSlug] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedBlock = design.blocks.find(b => b.id === selectedBlockId);

  // Load a template preset
  const loadTemplatePreset = (templateId: string) => {
    const presetBlocks: Record<string, EmailBlock[]> = {
      'ecom-welcome': [
        { ...createBlock('header'), content: { logoUrl: '', title: '{{site.name}}' } },
        { ...createBlock('hero'), content: { title: 'Welcome to {{site.name}}! 🎉', subtitle: "We're thrilled to have you join our community.", buttonText: 'Start Shopping', buttonLink: '#' }, styles: { ...DEFAULT_BLOCKS.hero.styles, backgroundColor: '#4F46E5' } },
        { ...createBlock('discountCode'), content: { headline: 'Your Welcome Gift', description: 'Enjoy 20% off your first order', code: 'WELCOME20', discount: '20% OFF', expiryText: 'Valid for 7 days', buttonText: 'Shop Now', buttonLink: '#' } },
        { ...createBlock('productGrid'), content: { title: 'Popular Products', products: DEFAULT_BLOCKS.productGrid.content?.products } },
        { ...createBlock('footer') }
      ],
      'ecom-cart': [
        { ...createBlock('header') },
        { ...createBlock('text'), content: { text: 'Hi {{user.name}},' } },
        { ...createBlock('cartAbandonment') },
        { ...createBlock('discountCode'), content: { ...DEFAULT_BLOCKS.discountCode.content, headline: 'Need a little push?', code: 'COMEBACK10', discount: '10% OFF' }, styles: { ...DEFAULT_BLOCKS.discountCode.styles, backgroundColor: '#FEF3C7', textColor: '#92400E' } },
        { ...createBlock('footer') }
      ],
      'ecom-order': [
        { ...createBlock('header') },
        { ...createBlock('orderConfirmation') },
        { ...createBlock('productRecommendations') },
        { ...createBlock('footer') }
      ],
      'ecom-sale': [
        { ...createBlock('header') },
        { ...createBlock('saleAnnouncement') },
        { ...createBlock('countdown'), content: { ...DEFAULT_BLOCKS.countdown.content, headline: 'Sale Ends In' } },
        { ...createBlock('productGrid') },
        { ...createBlock('footer') }
      ],
      'edu-enroll': [
        { ...createBlock('header') },
        { ...createBlock('hero'), content: { title: "You're Enrolled! 🎉", subtitle: 'Get ready to start learning', buttonText: 'Go to Course', buttonLink: '#' }, styles: { ...DEFAULT_BLOCKS.hero.styles, backgroundColor: '#8B5CF6' } },
        { ...createBlock('courseCard') },
        { ...createBlock('iconList'), content: { title: "What You'll Learn", items: [{ icon: '✓', text: 'Core concepts and fundamentals' }, { icon: '✓', text: 'Hands-on practical exercises' }, { icon: '✓', text: 'Real-world project experience' }] } },
        { ...createBlock('footer') }
      ],
      'edu-progress': [
        { ...createBlock('header') },
        { ...createBlock('lessonProgress') },
        { ...createBlock('text'), content: { text: "You're making great progress! Keep the momentum going." } },
        { ...createBlock('courseRecommendations') },
        { ...createBlock('footer') }
      ],
      'edu-cert': [
        { ...createBlock('certificateAnnouncement') },
        { ...createBlock('social'), content: { title: 'Share Your Achievement' } },
        { ...createBlock('courseRecommendations'), content: { ...DEFAULT_BLOCKS.courseRecommendations.content, title: 'Continue Learning' } }
      ],
      'blog-newsletter': [
        { ...createBlock('header'), styles: { ...DEFAULT_BLOCKS.header.styles, backgroundColor: '#3B82F6', textColor: '#ffffff' } },
        { ...createBlock('text'), content: { text: "This week's highlights from our blog" }, styles: { ...DEFAULT_BLOCKS.text.styles, textAlign: 'center', fontSize: 18 } },
        { ...createBlock('featuredArticle') },
        { ...createBlock('divider') },
        { ...createBlock('relatedPosts'), content: { title: 'More This Week' } },
        { ...createBlock('newsletterSignup'), content: { headline: 'Enjoying our content?', buttonText: 'Share with a Friend' } },
        { ...createBlock('footer') }
      ],
      'blog-post': [
        { ...createBlock('header') },
        { ...createBlock('featuredArticle') },
        { ...createBlock('authorBio') },
        { ...createBlock('relatedPosts') },
        { ...createBlock('footer') }
      ],
      'saas-onboard': [
        { ...createBlock('header') },
        { ...createBlock('hero'), content: { title: 'Welcome to {{site.name}}!', subtitle: "Let's get you set up", buttonText: 'Get Started', buttonLink: '#' } },
        { ...createBlock('progressBar'), content: { title: 'Your Setup Progress', current: 25, goal: 100, description: 'Complete your profile to unlock all features' } },
        { ...createBlock('iconList'), content: { title: 'Quick Start Checklist', items: [{ icon: '1', text: 'Complete your profile' }, { icon: '2', text: 'Connect your accounts' }, { icon: '3', text: 'Invite team members' }] } },
        { ...createBlock('cta'), content: { title: 'Need Help?', subtitle: 'Our support team is here for you', buttonText: 'Contact Support' } },
        { ...createBlock('footer') }
      ],
      'saas-feature': [
        { ...createBlock('header') },
        { ...createBlock('hero'), content: { title: "🚀 What's New", subtitle: 'Exciting updates just for you', buttonText: 'See All Updates' }, styles: { ...DEFAULT_BLOCKS.hero.styles, backgroundColor: '#10B981' } },
        { ...createBlock('features') },
        { ...createBlock('cta'), content: { title: 'Try It Now', buttonText: 'Open Dashboard' } },
        { ...createBlock('footer') }
      ],
      'saas-usage': [
        { ...createBlock('header') },
        { ...createBlock('text'), content: { text: 'Your Monthly Report - {{report.month}}' }, styles: { ...DEFAULT_BLOCKS.text.styles, fontSize: 24, textAlign: 'center' } },
        { ...createBlock('statsGrid'), content: { stats: [{ value: '1,234', label: 'Active Users', icon: '👥' }, { value: '5,678', label: 'Actions', icon: '⚡' }, { value: '+12%', label: 'Growth', icon: '📈' }] } },
        { ...createBlock('progressBar'), content: { title: 'Plan Usage', current: 65, goal: 100, description: '65% of your monthly limit used' } },
        { ...createBlock('cta'), content: { title: 'Need More?', subtitle: 'Upgrade your plan for unlimited access', buttonText: 'View Plans' } },
        { ...createBlock('footer') }
      ]
    };

    const blocks = presetBlocks[templateId];
    if (blocks) {
      setDesign(prev => ({ ...prev, blocks: blocks.map(b => ({ ...b, id: generateId() })) }));
      setShowTemplateLibrary(false);
      setSelectedBlockId(null);
      toast.success('Template loaded! Customize it to fit your needs.');
    }
  };

  // Load media library
  const loadMedia = useCallback(async () => {
    try {
      const response = await mediaApi.getAll({ limit: 50 });
      const rawItems = response.data.data || response.data || [];
      // Normalize media items - backend returns 'path' but we need 'url'
      const normalizedItems = rawItems.map((item: any) => ({
        ...item,
        url: item.url || item.path, // Use url if available, fallback to path
        filename: item.filename || item.originalName,
      }));
      setMediaItems(normalizedItems);
    } catch (error) {
      console.error('Failed to load media:', error);
    }
  }, []);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Block operations
  const addBlock = useCallback((type: BlockType, index?: number) => {
    const newBlock = createBlock(type);
    setDesign(prev => {
      const blocks = [...prev.blocks];
      if (index !== undefined) {
        blocks.splice(index, 0, newBlock);
      } else {
        blocks.push(newBlock);
      }
      return { ...prev, blocks };
    });
    setSelectedBlockId(newBlock.id);
    toast.success(`${BLOCK_INFO[type].label} block added`);
  }, []);

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    setDesign(prev => {
      const blocks = [...prev.blocks];
      const index = blocks.findIndex(b => b.id === blockId);
      if (index === -1) return prev;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= blocks.length) return prev;
      [blocks[index], blocks[newIndex]] = [blocks[newIndex], blocks[index]];
      return { ...prev, blocks };
    });
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setDesign(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== blockId) }));
    setSelectedBlockId(null);
    toast.success('Block deleted');
  }, []);

  const duplicateBlock = useCallback((blockId: string) => {
    setDesign(prev => {
      const blocks = [...prev.blocks];
      const index = blocks.findIndex(b => b.id === blockId);
      if (index === -1) return prev;
      const newBlock = { ...blocks[index], id: generateId(), content: { ...blocks[index].content }, styles: { ...blocks[index].styles } };
      blocks.splice(index + 1, 0, newBlock);
      return { ...prev, blocks };
    });
    toast.success('Block duplicated');
  }, []);

  const updateBlockContent = useCallback((blockId: string, content: Record<string, any>) => {
    setDesign(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === blockId ? { ...b, content: { ...b.content, ...content } } : b)
    }));
  }, []);

  const updateBlockStyles = useCallback((blockId: string, styles: Record<string, any>) => {
    setDesign(prev => ({
      ...prev,
      blocks: prev.blocks.map(b => b.id === blockId ? { ...b, styles: { ...b.styles, ...styles } } : b)
    }));
  }, []);

  const updateGlobalStyles = useCallback((styles: Partial<EmailDesign['globalStyles']>) => {
    setDesign(prev => ({ ...prev, globalStyles: { ...prev.globalStyles, ...styles } }));
  }, []);

  // Open media library for a specific block field
  const openMediaLibrary = (blockId: string, field: string) => {
    setMediaTarget({ blockId, field });
    setShowMediaModal(true);
  };

  // Select media item
  const selectMedia = (item: MediaItem) => {
    if (mediaTarget) {
      updateBlockContent(mediaTarget.blockId, { [mediaTarget.field]: item.url });
      setShowMediaModal(false);
      setMediaTarget(null);
      toast.success('Image selected');
    }
  };

  // Filter media by search
  const filteredMedia = mediaItems.filter(item =>
    item.mimeType?.startsWith('image/') &&
    (mediaSearch === '' || item.filename?.toLowerCase().includes(mediaSearch.toLowerCase()))
  );

  // Generate email HTML
  const generateHtml = useCallback((): string => {
    const { blocks, globalStyles } = design;

    const renderBlock = (block: EmailBlock): string => {
      const { type, content, styles } = block;
      const primaryColor = globalStyles.primaryColor;

      switch (type) {
        case 'header':
          const headerLogoSize = styles.logoSize || 48;
          const headerBg = styles.backgroundColor || '#ffffff';
          const headerTextColor = styles.textColor || globalStyles.textColor;
          return `<tr><td style="background:${headerBg};padding:${styles.padding}px;text-align:${styles.textAlign};border-bottom:1px solid #e5e7eb;">
            ${content.logoUrl ? `<img src="${content.logoUrl}" alt="Logo" style="max-height:${headerLogoSize}px;margin-bottom:12px;">` : ''}
            <h1 style="margin:0;font-size:24px;font-weight:700;color:${headerTextColor};">${content.title}</h1>
          </td></tr>`;

        case 'text':
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;font-size:${styles.fontSize}px;line-height:${styles.lineHeight};text-align:${styles.textAlign};color:${styles.color};">
            ${content.text}
          </td></tr>`;

        case 'image':
          const imgHtml = content.src ? `<img src="${content.src}" alt="${content.alt}" style="max-width:100%;border-radius:${styles.borderRadius}px;display:block;margin:0 auto;">` : '<div style="background:#e5e7eb;height:200px;display:flex;align-items:center;justify-content:center;border-radius:8px;color:#9ca3af;">No image selected</div>';
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;text-align:center;">
            ${content.link ? `<a href="${content.link}">${imgHtml}</a>` : imgHtml}
          </td></tr>`;

        case 'button':
          return `<tr><td style="padding:24px;text-align:${styles.align};">
            <a href="${content.link}" style="display:inline-block;background:${styles.backgroundColor};color:${styles.textColor};padding:${styles.padding}px ${styles.padding * 2}px;border-radius:${styles.borderRadius}px;text-decoration:none;font-size:${styles.fontSize}px;font-weight:600;">
              ${content.text}
            </a>
          </td></tr>`;

        case 'divider':
          return `<tr><td style="padding:${styles.padding}px 0;"><hr style="border:none;border-top:${styles.thickness}px solid ${styles.color};margin:0;"></td></tr>`;

        case 'spacer':
          return `<tr><td style="height:${styles.height}px;"></td></tr>`;

        case 'hero':
          return `<tr><td style="background:linear-gradient(135deg,${primaryColor},#7c3aed);padding:${styles.padding}px;text-align:${styles.textAlign};">
            <h1 style="margin:0 0 16px;font-size:36px;font-weight:800;color:${styles.textColor};">${content.title}</h1>
            <p style="margin:0 0 32px;font-size:18px;color:${styles.textColor};opacity:0.9;">${content.subtitle}</p>
            <a href="${content.buttonLink}" style="display:inline-block;background:#fff;color:${primaryColor};padding:16px 40px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;">
              ${content.buttonText}
            </a>
          </td></tr>`;

        case 'footer':
          const footerFontSize = styles.fontSize || 14;
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;text-align:${styles.textAlign};color:${styles.color};font-size:${footerFontSize}px;">
            <p style="margin:0 0 8px;font-weight:600;">${content.companyName}</p>
            <p style="margin:0 0 16px;">${content.address}</p>
            <a href="${content.unsubscribeLink || '#'}" style="color:${styles.color || '#9ca3af'};">${content.unsubscribeText}</a>
          </td></tr>`;

        case 'cta':
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;text-align:${styles.textAlign};border-radius:12px;">
            <h2 style="margin:0 0 12px;font-size:28px;font-weight:700;color:${globalStyles.textColor};">${content.title}</h2>
            <p style="margin:0 0 24px;color:#6b7280;font-size:16px;">${content.subtitle}</p>
            <a href="${content.buttonLink}" style="display:inline-block;background:${primaryColor};color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
              ${content.buttonText}
            </a>
          </td></tr>`;

        case 'features':
          const featuresHtml = (content.features || []).map((f: any) =>
            `<td style="padding:16px;text-align:center;width:33%;">
              <div style="font-size:32px;margin-bottom:12px;">${f.icon}</div>
              <h3 style="margin:0 0 8px;font-size:16px;font-weight:600;color:${globalStyles.textColor};">${f.title}</h3>
              <p style="margin:0;color:#6b7280;font-size:14px;">${f.desc || f.description || ''}</p>
            </td>`
          ).join('');
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;">
            <h2 style="margin:0 0 24px;text-align:center;font-size:24px;font-weight:700;color:${globalStyles.textColor};">${content.title}</h2>
            <table width="100%" cellpadding="0" cellspacing="0"><tr>${featuresHtml}</tr></table>
          </td></tr>`;

        case 'testimonial':
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;text-align:${styles.textAlign};border-left:4px solid ${primaryColor};">
            <p style="margin:0 0 16px;font-size:18px;font-style:italic;color:${globalStyles.textColor};">${content.quote}</p>
            <p style="margin:0;font-weight:600;color:${globalStyles.textColor};">${content.author}</p>
            <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">${content.role}</p>
          </td></tr>`;

        case 'social':
          const iconSize = styles.iconSize || 32;
          const iconSpacing = styles.iconSpacing || 12;
          const iconStyle = styles.iconStyle || 'colored';
          const enabledLinks = (content.links || []).filter((l: any) => l.enabled !== false);
          const socialLinksHtml = enabledLinks.map((l: any) => {
            const platform = SOCIAL_PLATFORMS[l.platform as SocialPlatform];
            if (!platform) return '';
            const bgColor = iconStyle === 'colored' ? platform.color : (iconStyle === 'dark' ? '#1f2937' : '#ffffff');
            const iconColor = iconStyle === 'light' ? '#1f2937' : '#ffffff';
            const borderStyle = iconStyle === 'light' ? `border:1px solid #e5e7eb;` : '';
            return `<a href="${l.url}" target="_blank" style="display:inline-block;margin:0 ${iconSpacing/2}px;text-decoration:none;">
              <div style="width:${iconSize}px;height:${iconSize}px;background:${bgColor};border-radius:${iconSize/4}px;${borderStyle}display:flex;align-items:center;justify-content:center;">
                <div style="width:${iconSize*0.55}px;height:${iconSize*0.55}px;color:${iconColor};">${platform.icon}</div>
              </div>
            </a>`;
          }).join('');
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;text-align:${styles.align};">
            ${content.title ? `<p style="margin:0 0 16px;font-weight:600;font-size:16px;color:${globalStyles.textColor};">${content.title}</p>` : ''}
            <div style="display:inline-block;">${socialLinksHtml}</div>
          </td></tr>`;

        case 'columns':
          const numCols = content.columns || 2;
          const colWidth = Math.floor(100 / numCols);
          const colsHtml = Array.from({ length: numCols }, (_, i) =>
            `<td style="width:${colWidth}%;padding:${styles.gap || 16}px;vertical-align:top;font-size:14px;color:${globalStyles.textColor};">
              ${content[`column${i + 1}`] || ''}
            </td>`
          ).join('');
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;">
            <table width="100%" cellpadding="0" cellspacing="0"><tr>${colsHtml}</tr></table>
          </td></tr>`;

        case 'section':
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;border-radius:${styles.borderRadius || 0}px;">
            ${content.showTitle && content.title ? `<h3 style="margin:0 0 16px;font-size:20px;font-weight:600;color:${globalStyles.textColor};">${content.title}</h3>` : ''}
          </td></tr>`;

        // E-commerce blocks
        case 'productShowcase':
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              ${content.productImage ? `<tr><td><img src="${content.productImage}" alt="${content.productName}" style="width:100%;max-width:400px;border-radius:8px;display:block;margin:0 auto 16px;"/></td></tr>` : ''}
              ${styles.showBadge && content.badge ? `<tr><td style="text-align:center;"><span style="display:inline-block;background:${styles.accentColor || '#EF4444'};color:#fff;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:600;margin-bottom:8px;">${content.badge}</span></td></tr>` : ''}
              <tr><td style="text-align:center;"><h3 style="margin:0 0 8px;font-size:24px;color:${globalStyles.textColor};">${content.productName}</h3></td></tr>
              ${styles.showRating ? `<tr><td style="text-align:center;color:#F59E0B;font-size:14px;margin-bottom:8px;">${'★'.repeat(Math.floor(content.rating || 0))}${'☆'.repeat(5 - Math.floor(content.rating || 0))} (${content.reviewCount} reviews)</td></tr>` : ''}
              <tr><td style="text-align:center;"><span style="font-size:28px;font-weight:bold;color:${globalStyles.primaryColor};">${content.price}</span>${styles.showOriginalPrice && content.originalPrice ? `<span style="text-decoration:line-through;color:#9CA3AF;margin-left:8px;">${content.originalPrice}</span>` : ''}</td></tr>
              <tr><td style="padding:16px 0;text-align:center;color:${globalStyles.textColor};font-size:14px;">${content.description}</td></tr>
              <tr><td style="text-align:center;"><a href="${content.buttonLink}" style="display:inline-block;background:${styles.buttonColor || globalStyles.primaryColor};color:${styles.buttonTextColor || '#fff'};padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">${content.buttonText}</a></td></tr>
            </table>
          </td></tr>`;

        case 'productGrid':
          const productsHtml = (content.products || []).map((p: any) =>
            `<td style="width:${100 / (styles.columns || 2)}%;padding:8px;vertical-align:top;">
              <div style="background:${styles.productCardBg || '#fff'};border-radius:${styles.borderRadius || 8}px;padding:12px;text-align:center;">
                ${p.image ? `<img src="${p.image}" alt="${p.name}" style="width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;margin-bottom:8px;"/>` : '<div style="width:100%;aspect-ratio:1;background:#f3f4f6;border-radius:6px;margin-bottom:8px;"></div>'}
                <p style="margin:0 0 4px;font-weight:600;color:${globalStyles.textColor};">${p.name}</p>
                <p style="margin:0;color:${globalStyles.primaryColor};font-weight:bold;">${p.price}</p>
              </div>
            </td>`
          ).join('');
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;">
            ${content.title ? `<h3 style="margin:0 0 16px;font-size:20px;text-align:center;color:${globalStyles.textColor};">${content.title}</h3>` : ''}
            <table width="100%" cellpadding="0" cellspacing="0"><tr>${productsHtml}</tr></table>
          </td></tr>`;

        case 'discountCode':
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;text-align:center;border-radius:${styles.borderRadius || 0}px;">
            <h2 style="margin:0 0 8px;font-size:24px;color:${styles.textColor || '#fff'};">${content.headline}</h2>
            <p style="margin:0 0 20px;color:${styles.textColor || '#fff'};opacity:0.9;">${content.description}</p>
            <div style="display:inline-block;background:${styles.codeBackground || '#fff'};padding:16px 32px;border-radius:8px;border:2px ${styles.borderStyle || 'dashed'} ${styles.codeColor || globalStyles.primaryColor};margin-bottom:16px;">
              <span style="font-size:28px;font-weight:bold;color:${styles.codeColor || globalStyles.primaryColor};letter-spacing:2px;">${content.code}</span>
            </div>
            <p style="margin:0 0 8px;font-size:20px;font-weight:bold;color:${styles.textColor || '#fff'};">${content.discount}</p>
            <p style="margin:0 0 20px;font-size:14px;color:${styles.textColor || '#fff'};opacity:0.8;">${content.expiryText}</p>
            <a href="${content.buttonLink}" style="display:inline-block;background:${styles.codeBackground || '#fff'};color:${styles.backgroundColor};padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">${content.buttonText}</a>
            ${content.terms ? `<p style="margin:16px 0 0;font-size:11px;color:${styles.textColor || '#fff'};opacity:0.7;">${content.terms}</p>` : ''}
          </td></tr>`;

        case 'countdown':
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;text-align:center;">
            <h2 style="margin:0 0 20px;font-size:24px;color:${styles.textColor || '#fff'};">${content.headline}</h2>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 20px;">
              <tr>
                <td style="padding:0 8px;text-align:center;">
                  <div style="background:${styles.boxColor || '#fff'};padding:16px 20px;border-radius:8px;min-width:60px;">
                    <span style="font-size:32px;font-weight:bold;color:${styles.boxTextColor || globalStyles.primaryColor};">00</span>
                  </div>
                  <p style="margin:8px 0 0;font-size:12px;color:${styles.textColor || '#fff'};">${content.labels?.days || 'Days'}</p>
                </td>
                <td style="padding:0 8px;text-align:center;">
                  <div style="background:${styles.boxColor || '#fff'};padding:16px 20px;border-radius:8px;min-width:60px;">
                    <span style="font-size:32px;font-weight:bold;color:${styles.boxTextColor || globalStyles.primaryColor};">00</span>
                  </div>
                  <p style="margin:8px 0 0;font-size:12px;color:${styles.textColor || '#fff'};">${content.labels?.hours || 'Hours'}</p>
                </td>
                <td style="padding:0 8px;text-align:center;">
                  <div style="background:${styles.boxColor || '#fff'};padding:16px 20px;border-radius:8px;min-width:60px;">
                    <span style="font-size:32px;font-weight:bold;color:${styles.boxTextColor || globalStyles.primaryColor};">00</span>
                  </div>
                  <p style="margin:8px 0 0;font-size:12px;color:${styles.textColor || '#fff'};">${content.labels?.minutes || 'Mins'}</p>
                </td>
              </tr>
            </table>
            ${content.showButton ? `<a href="${content.buttonLink}" style="display:inline-block;background:${styles.boxColor || '#fff'};color:${styles.backgroundColor};padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:600;">${content.buttonText}</a>` : ''}
          </td></tr>`;

        case 'progressBar':
          const percent = Math.min(100, Math.max(0, (content.current / content.goal) * 100));
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;">
            ${content.title ? `<h3 style="margin:0 0 12px;font-size:18px;color:${globalStyles.textColor};">${content.title}</h3>` : ''}
            <div style="background:${styles.trackColor || '#E5E7EB'};height:${styles.height || 12}px;border-radius:${styles.borderRadius || 6}px;overflow:hidden;">
              <div style="background:${styles.progressColor || '#10B981'};height:100%;width:${percent}%;border-radius:${styles.borderRadius || 6}px;"></div>
            </div>
            ${content.showPercentage ? `<p style="margin:8px 0 0;font-size:14px;color:${globalStyles.textColor};">${Math.round(percent)}% complete</p>` : ''}
            ${content.description ? `<p style="margin:4px 0 0;font-size:14px;color:#6B7280;">${content.description}</p>` : ''}
          </td></tr>`;

        case 'statsGrid':
          const statsHtml = (content.stats || []).map((s: any) =>
            `<td style="padding:12px;text-align:center;">
              ${styles.showIcons && s.icon ? `<div style="font-size:24px;margin-bottom:8px;">${s.icon}</div>` : ''}
              <div style="font-size:${styles.statValueSize || 36}px;font-weight:bold;color:${styles.textColor || '#fff'};">${s.value}</div>
              <div style="font-size:${styles.labelSize || 14}px;color:${styles.textColor || '#fff'};opacity:0.8;">${s.label}</div>
            </td>`
          ).join('');
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;">
            ${content.title ? `<h3 style="margin:0 0 20px;text-align:center;font-size:20px;color:${styles.textColor || '#fff'};">${content.title}</h3>` : ''}
            <table width="100%" cellpadding="0" cellspacing="0"><tr>${statsHtml}</tr></table>
          </td></tr>`;

        case 'iconList':
          const listHtml = (content.items || []).map((item: any) =>
            `<tr><td style="padding:${(styles.spacing || 16) / 2}px 0;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="width:${styles.iconSize || 24}px;height:${styles.iconSize || 24}px;background:${styles.iconBgColor || '#D1FAE5'};border-radius:50%;text-align:center;vertical-align:middle;color:${styles.iconColor || '#10B981'};font-size:14px;">${item.icon}</td>
                <td style="padding-left:12px;color:${item.highlight ? styles.highlightColor || '#4F46E5' : styles.textColor || '#374151'};font-weight:${item.highlight ? '600' : '400'};">${item.text}</td>
              </tr></table>
            </td></tr>`
          ).join('');
          return `<tr><td style="background:${styles.backgroundColor};padding:${styles.padding}px;">
            ${content.title ? `<h3 style="margin:0 0 16px;font-size:18px;color:${globalStyles.textColor};">${content.title}</h3>` : ''}
            <table width="100%" cellpadding="0" cellspacing="0">${listHtml}</table>
          </td></tr>`;

        default:
          return '';
      }
    };

    // Wrapper function that applies conditional logic
    const renderBlockWithConditional = (block: EmailBlock): string => {
      const html = renderBlock(block);
      if (!block.conditional?.enabled || !html) return html;

      const { field, operator, value } = block.conditional;
      const conditionStr = operator === 'exists'
        ? `{{#if ${field}}}`
        : operator === 'equals'
          ? `{{#ifEquals ${field} "${value}"}}`
          : operator === 'notEquals'
            ? `{{#ifNotEquals ${field} "${value}"}}`
            : operator === 'contains'
              ? `{{#ifContains ${field} "${value}"}}`
              : operator === 'greaterThan'
                ? `{{#ifGt ${field} ${value}}}`
                : `{{#ifLt ${field} ${value}}}`;
      return `${conditionStr}${html}{{/if}}`;
    };

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Email</title></head>
<body style="margin:0;padding:0;background:${globalStyles.backgroundColor};font-family:${globalStyles.fontFamily};">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${globalStyles.backgroundColor};">
<tr><td align="center" style="padding:20px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="${globalStyles.contentWidth}" style="max-width:${globalStyles.contentWidth}px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
${blocks.map(renderBlockWithConditional).join('')}
</table></td></tr></table></body></html>`;
  }, [design]);

  // Save template
  const handleSave = async () => {
    if (!templateName || !templateSlug) {
      toast.error('Please enter template name and slug');
      return;
    }
    setSaving(true);
    try {
      const htmlContent = generateHtml();
      await emailApi.createTemplate({
        name: templateName,
        slug: templateSlug,
        subject: templateSubject || templateName,
        htmlContent,
        textContent: '',
        type: 'CUSTOM',
        variables: [{ name: '__design__', description: 'Design data', example: JSON.stringify(design) }],
        isActive: true
      });
      toast.success('Template saved!');
      setShowSaveModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  // Beautiful block preview renderer
  const renderBlockPreview = (block: EmailBlock) => {
    const { type, content, styles } = block;
    const isSelected = selectedBlockId === block.id;
    const primary = design.globalStyles.primaryColor;

    const wrapperClass = `relative transition-all duration-200 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:ring-2 hover:ring-indigo-200'}`;

    switch (type) {
      case 'header':
        const previewHeaderBg = styles.backgroundColor || '#ffffff';
        const previewHeaderTextColor = styles.textColor || '#1f2937';
        const previewLogoSize = styles.logoSize || 48;
        return (
          <div className={wrapperClass} style={{ background: previewHeaderBg, padding: styles.padding, textAlign: styles.textAlign as any, borderBottom: '1px solid #e5e7eb' }}>
            {content.logoUrl && <img src={content.logoUrl} alt="Logo" style={{ maxHeight: previewLogoSize, display: 'block', margin: styles.textAlign === 'center' ? '0 auto 12px' : styles.textAlign === 'right' ? '0 0 12px auto' : '0 auto 12px 0' }} />}
            <h1 className="text-2xl font-bold m-0" style={{ color: previewHeaderTextColor }}>{content.title}</h1>
          </div>
        );

      case 'text':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, fontSize: styles.fontSize, lineHeight: styles.lineHeight, textAlign: styles.textAlign as any, color: styles.color }}>
            {content.text}
          </div>
        );

      case 'image':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, textAlign: 'center' }}>
            {content.src ? (
              <img src={content.src} alt={content.alt} className="max-w-full rounded-lg shadow-sm mx-auto" style={{ borderRadius: styles.borderRadius }} />
            ) : (
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-48 rounded-lg flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                <FiImage size={48} className="mb-2" />
                <span className="text-sm">Click to add image from Media Library</span>
              </div>
            )}
          </div>
        );

      case 'button':
        return (
          <div className={wrapperClass} style={{ padding: 24, textAlign: styles.align as any }}>
            <span className="inline-block shadow-lg transform hover:scale-105 transition-transform" style={{
              background: `linear-gradient(135deg, ${styles.backgroundColor}, ${styles.backgroundColor}dd)`,
              color: styles.textColor,
              padding: `${styles.padding}px ${styles.padding * 2}px`,
              borderRadius: styles.borderRadius,
              fontSize: styles.fontSize,
              fontWeight: 600
            }}>
              {content.text}
            </span>
          </div>
        );

      case 'divider':
        return (
          <div className={wrapperClass} style={{ padding: `${styles.padding}px 0` }}>
            <hr style={{ border: 'none', borderTop: `${styles.thickness}px solid ${styles.color}`, margin: 0 }} />
          </div>
        );

      case 'spacer':
        return (
          <div className={wrapperClass} style={{ height: styles.height, background: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(79,70,229,0.03) 10px, rgba(79,70,229,0.03) 20px)' }}>
            <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
              {styles.height}px
            </div>
          </div>
        );

      case 'hero':
        return (
          <div className={wrapperClass} style={{ background: `linear-gradient(135deg, ${primary}, #7c3aed)`, padding: styles.padding, textAlign: styles.textAlign as any }}>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{content.title}</h1>
            <p className="text-lg text-white/90 mb-8 max-w-md mx-auto">{content.subtitle}</p>
            <span className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-bold shadow-lg">
              {content.buttonText}
            </span>
          </div>
        );

      case 'footer':
        const previewFooterFontSize = styles.fontSize || 14;
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, textAlign: styles.textAlign as any, color: styles.color, fontSize: previewFooterFontSize }}>
            <p className="font-semibold mb-2">{content.companyName}</p>
            <p className="mb-4">{content.address}</p>
            <a href="#" className="hover:opacity-80 underline" style={{ color: styles.color }}>{content.unsubscribeText}</a>
          </div>
        );

      case 'cta':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, textAlign: styles.textAlign as any, borderRadius: 12 }}>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">{content.title}</h2>
            <p className="text-gray-600 mb-6">{content.subtitle}</p>
            <span className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold shadow-md">
              {content.buttonText}
            </span>
          </div>
        );

      case 'features':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding }}>
            <h2 className="text-xl font-bold text-center text-gray-800 mb-6">{content.title}</h2>
            <div className="grid grid-cols-3 gap-4">
              {(content.features || []).map((f: any, i: number) => (
                <div key={i} className="text-center p-4">
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 className="font-semibold text-gray-800 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-600">{f.desc || f.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'testimonial':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, textAlign: styles.textAlign as any, borderLeft: `4px solid ${primary}` }}>
            <p className="text-lg italic text-gray-700 mb-4">{content.quote}</p>
            <p className="font-semibold text-gray-800">{content.author}</p>
            <p className="text-sm text-gray-500">{content.role}</p>
          </div>
        );

      case 'social':
        const previewIconSize = styles.iconSize || 32;
        const previewIconSpacing = styles.iconSpacing || 12;
        const previewIconStyle = styles.iconStyle || 'colored';
        const previewEnabledLinks = (content.links || []).filter((l: any) => l.enabled !== false);
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, textAlign: styles.align as any }}>
            {content.title && <p className="font-semibold text-gray-800 mb-4">{content.title}</p>}
            <div className="flex justify-center flex-wrap" style={{ gap: previewIconSpacing }}>
              {previewEnabledLinks.map((l: any, i: number) => {
                const platform = SOCIAL_PLATFORMS[l.platform as SocialPlatform];
                if (!platform) return null;
                const bgColor = previewIconStyle === 'colored' ? platform.color : (previewIconStyle === 'dark' ? '#1f2937' : '#ffffff');
                const iconColor = previewIconStyle === 'light' ? '#1f2937' : '#ffffff';
                const borderStyle = previewIconStyle === 'light' ? '1px solid #e5e7eb' : 'none';
                return (
                  <div
                    key={i}
                    className="cursor-pointer hover:scale-110 transition-transform flex items-center justify-center"
                    style={{
                      width: previewIconSize,
                      height: previewIconSize,
                      backgroundColor: bgColor,
                      borderRadius: previewIconSize / 4,
                      border: borderStyle,
                    }}
                    title={platform.name}
                  >
                    <div
                      style={{ width: previewIconSize * 0.55, height: previewIconSize * 0.55, color: iconColor }}
                      dangerouslySetInnerHTML={{ __html: platform.icon }}
                    />
                  </div>
                );
              })}
            </div>
            {previewEnabledLinks.length === 0 && (
              <p className="text-gray-400 text-sm">No social links enabled. Click to add.</p>
            )}
          </div>
        );

      case 'columns':
        const previewNumCols = content.columns || 2;
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding }}>
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${previewNumCols}, 1fr)` }}>
              {Array.from({ length: previewNumCols }, (_, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[60px]">
                  <p className="text-gray-600 text-sm">{content[`column${i + 1}`] || `Column ${i + 1}`}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'section':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, borderRadius: styles.borderRadius }}>
            {content.showTitle && content.title && <h3 className="text-lg font-semibold text-gray-800 mb-3">{content.title}</h3>}
            <p className="text-gray-400 text-sm italic">Section content area</p>
          </div>
        );

      // E-commerce Blocks
      case 'productShowcase':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding }}>
            <div className="text-center">
              {content.productImage ? (
                <img src={content.productImage} alt={content.productName} className="w-48 h-48 object-cover rounded-lg mx-auto mb-4" />
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center text-gray-400">
                  <FiImage size={48} />
                </div>
              )}
              {styles.showBadge && content.badge && (
                <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full text-white mb-2" style={{ background: styles.accentColor || '#EF4444' }}>{content.badge}</span>
              )}
              <h3 className="text-xl font-bold text-gray-800 mb-2">{content.productName}</h3>
              {styles.showRating && <div className="text-yellow-400 text-sm mb-2">{'★'.repeat(Math.floor(content.rating || 0))}{'☆'.repeat(5 - Math.floor(content.rating || 0))} <span className="text-gray-500">({content.reviewCount})</span></div>}
              <div className="mb-3">
                <span className="text-2xl font-bold" style={{ color: styles.buttonColor || '#4F46E5' }}>{content.price}</span>
                {styles.showOriginalPrice && content.originalPrice && <span className="text-gray-400 line-through ml-2">{content.originalPrice}</span>}
              </div>
              <p className="text-gray-600 text-sm mb-4">{content.description}</p>
              <button className="px-6 py-3 rounded-lg text-white font-semibold" style={{ background: styles.buttonColor || '#4F46E5' }}>{content.buttonText}</button>
            </div>
          </div>
        );

      case 'productGrid':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding }}>
            {content.title && <h3 className="text-lg font-semibold text-gray-800 text-center mb-4">{content.title}</h3>}
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${styles.columns || 2}, 1fr)` }}>
              {(content.products || []).slice(0, 4).map((p: any, i: number) => (
                <div key={i} className="p-3 rounded-lg text-center" style={{ background: styles.productCardBg || '#fff' }}>
                  {p.image ? <img src={p.image} alt={p.name} className="w-full aspect-square object-cover rounded-md mb-2" /> : <div className="w-full aspect-square bg-gray-100 rounded-md mb-2" />}
                  <p className="text-sm font-medium text-gray-700">{p.name}</p>
                  <p className="text-sm font-bold" style={{ color: design.globalStyles.primaryColor }}>{p.price}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'discountCode':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, borderRadius: styles.borderRadius, textAlign: 'center' }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: styles.textColor || '#fff' }}>{content.headline}</h2>
            <p className="mb-4 opacity-90" style={{ color: styles.textColor || '#fff' }}>{content.description}</p>
            <div className="inline-block px-8 py-4 rounded-lg mb-3" style={{ background: styles.codeBackground || '#fff', border: `2px ${styles.borderStyle || 'dashed'} ${styles.codeColor || '#4F46E5'}` }}>
              <span className="text-2xl font-bold tracking-widest" style={{ color: styles.codeColor || '#4F46E5' }}>{content.code}</span>
            </div>
            <p className="text-xl font-bold mb-1" style={{ color: styles.textColor || '#fff' }}>{content.discount}</p>
            <p className="text-sm opacity-80 mb-4" style={{ color: styles.textColor || '#fff' }}>{content.expiryText}</p>
            <button className="px-6 py-3 rounded-lg font-semibold" style={{ background: styles.codeBackground || '#fff', color: styles.backgroundColor }}>{content.buttonText}</button>
          </div>
        );

      case 'countdown':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, textAlign: 'center' }}>
            <h2 className="text-2xl font-bold mb-5" style={{ color: styles.textColor || '#fff' }}>{content.headline}</h2>
            <div className="flex justify-center gap-3 mb-5">
              {['days', 'hours', 'minutes'].map((unit) => (
                <div key={unit} className="text-center">
                  <div className="px-5 py-3 rounded-lg mb-1" style={{ background: styles.boxColor || '#fff' }}>
                    <span className="text-3xl font-bold" style={{ color: styles.boxTextColor || '#4F46E5' }}>00</span>
                  </div>
                  <span className="text-xs" style={{ color: styles.textColor || '#fff' }}>{content.labels?.[unit] || unit}</span>
                </div>
              ))}
            </div>
            {content.showButton && <button className="px-6 py-3 rounded-lg font-semibold" style={{ background: styles.boxColor || '#fff', color: styles.backgroundColor }}>{content.buttonText}</button>}
          </div>
        );

      case 'progressBar':
        const progressPercent = Math.min(100, Math.max(0, (content.current / content.goal) * 100));
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding }}>
            {content.title && <h3 className="text-lg font-semibold text-gray-800 mb-3">{content.title}</h3>}
            <div className="rounded-full overflow-hidden" style={{ background: styles.trackColor || '#E5E7EB', height: styles.height || 12 }}>
              <div className="h-full rounded-full transition-all" style={{ background: styles.progressColor || '#10B981', width: `${progressPercent}%` }} />
            </div>
            {content.showPercentage && <p className="text-sm text-gray-600 mt-2">{Math.round(progressPercent)}% complete</p>}
            {content.description && <p className="text-sm text-gray-500 mt-1">{content.description}</p>}
          </div>
        );

      case 'statsGrid':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, textAlign: 'center' }}>
            {content.title && <h3 className="text-xl font-semibold mb-5" style={{ color: styles.textColor || '#fff' }}>{content.title}</h3>}
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${styles.columns || 4}, 1fr)` }}>
              {(content.stats || []).map((s: any, i: number) => (
                <div key={i}>
                  {styles.showIcons && s.icon && <div className="text-2xl mb-2">{s.icon}</div>}
                  <div className="font-bold" style={{ fontSize: styles.statValueSize || 36, color: styles.textColor || '#fff' }}>{s.value}</div>
                  <div style={{ fontSize: styles.labelSize || 14, color: styles.textColor || '#fff', opacity: 0.8 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'iconList':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding }}>
            {content.title && <h3 className="text-lg font-semibold text-gray-800 mb-4">{content.title}</h3>}
            <div className="space-y-3">
              {(content.items || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-sm" style={{ background: styles.iconBgColor || '#D1FAE5', color: styles.iconColor || '#10B981' }}>{item.icon}</span>
                  <span className={item.highlight ? 'font-semibold' : ''} style={{ color: item.highlight ? styles.highlightColor || '#4F46E5' : styles.textColor || '#374151' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        );

      // Course/LMS Blocks
      case 'courseCard':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, borderRadius: styles.borderRadius || 16 }}>
            {content.courseImage ? <img src={content.courseImage} alt={content.courseTitle} className="w-full h-32 object-cover rounded-lg mb-4" /> : <div className="w-full h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-gray-400"><FiImage size={32} /></div>}
            {styles.showTags && content.tags && <div className="flex gap-2 mb-2">{content.tags.map((t: string, i: number) => <span key={i} className="px-2 py-1 text-xs rounded" style={{ background: `${styles.accentColor || '#8B5CF6'}20`, color: styles.accentColor || '#8B5CF6' }}>{t}</span>)}</div>}
            <h3 className="text-lg font-bold text-gray-800 mb-2">{content.courseTitle}</h3>
            {styles.showInstructor && <p className="text-sm text-gray-500 mb-2">by {content.instructor}</p>}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span>{content.duration}</span>
              <span>{content.lessons} lessons</span>
              <span>{content.level}</span>
            </div>
            {styles.showRating && <div className="text-yellow-400 text-sm mb-3">{'★'.repeat(Math.floor(content.rating || 0))} <span className="text-gray-500">{content.rating} ({content.students} students)</span></div>}
            <div className="flex items-center justify-between">
              <span className="text-xl font-bold" style={{ color: styles.accentColor || '#8B5CF6' }}>{content.price}</span>
              <button className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: styles.buttonColor || '#8B5CF6' }}>{content.buttonText}</button>
            </div>
          </div>
        );

      case 'lessonProgress':
        const lessonPercent = content.percentComplete || 0;
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, borderRadius: styles.borderRadius || 12 }}>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{content.courseTitle}</h3>
            <p className="text-sm text-gray-500 mb-4">{content.courseName}</p>
            <div className="rounded-full overflow-hidden mb-2" style={{ background: styles.progressBgColor || '#E5E7EB', height: 8 }}>
              <div className="h-full rounded-full" style={{ background: styles.progressColor || '#10B981', width: `${lessonPercent}%` }} />
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-4">
              <span>{content.completedLessons}/{content.totalLessons} lessons</span>
              <span>{lessonPercent}%</span>
            </div>
            <p className="text-sm mb-1"><strong>Current:</strong> {content.currentLesson}</p>
            <p className="text-sm text-gray-500 mb-4"><strong>Next:</strong> {content.nextLesson}</p>
            {styles.showStreak && <p className="text-sm text-orange-500 mb-3">🔥 {content.streak} day streak!</p>}
            <button className="w-full py-2 rounded-lg text-white font-semibold" style={{ background: styles.progressColor || '#10B981' }}>{content.buttonText}</button>
          </div>
        );

      case 'certificateAnnouncement':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, textAlign: 'center' }}>
            <h2 className="text-3xl font-bold mb-2" style={{ color: styles.textColor || '#fff' }}>{content.headline}</h2>
            <p className="text-lg mb-2" style={{ color: styles.textColor || '#fff', opacity: 0.9 }}>{content.subheadline}</p>
            <p className="text-xl font-semibold mb-4" style={{ color: styles.accentColor || '#F59E0B' }}>{content.courseName}</p>
            <div className="inline-block border-4 rounded-lg px-8 py-4 mb-4" style={{ borderColor: styles.accentColor || '#F59E0B' }}>
              <p className="text-2xl font-bold" style={{ color: styles.textColor || '#fff' }}>{content.studentName}</p>
            </div>
            {styles.showSkills && content.skills && (
              <div className="flex flex-wrap justify-center gap-2 mb-4">
                {content.skills.map((s: string, i: number) => <span key={i} className="px-3 py-1 rounded-full text-sm" style={{ background: `${styles.accentColor || '#F59E0B'}30`, color: styles.accentColor || '#F59E0B' }}>{s}</span>)}
              </div>
            )}
            <button className="px-6 py-3 rounded-lg font-semibold" style={{ background: styles.accentColor || '#F59E0B', color: '#1F2937' }}>{content.buttonText}</button>
          </div>
        );

      // Blog Blocks
      case 'featuredArticle':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, borderRadius: styles.borderRadius || 16, overflow: 'hidden' }}>
            {content.image ? <img src={content.image} alt={content.title} className="w-full object-cover" style={{ height: styles.imageHeight || 240 }} /> : <div className="w-full bg-gray-100 flex items-center justify-center text-gray-400" style={{ height: styles.imageHeight || 240 }}><FiImage size={48} /></div>}
            <div className="p-6">
              {styles.showCategory && content.category && <span className="text-sm font-semibold" style={{ color: styles.categoryColor || '#8B5CF6' }}>{content.category}</span>}
              <h3 className="text-xl font-bold text-gray-800 mt-1 mb-2">{content.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{content.excerpt}</p>
              {styles.showAuthor && (
                <div className="flex items-center gap-2 mb-4">
                  {content.authorAvatar ? <img src={content.authorAvatar} alt={content.author} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-gray-200" />}
                  <span className="text-sm text-gray-600">{content.author}</span>
                  {styles.showReadTime && <span className="text-sm text-gray-400">· {content.readTime}</span>}
                </div>
              )}
              <button className="px-4 py-2 rounded-lg text-white text-sm font-semibold" style={{ background: styles.categoryColor || '#8B5CF6' }}>{content.buttonText}</button>
            </div>
          </div>
        );

      case 'newsletterSignup':
        return (
          <div className={wrapperClass} style={{ background: styles.backgroundColor, padding: styles.padding, borderRadius: styles.borderRadius || 16, textAlign: 'center' }}>
            <h2 className="text-2xl font-bold mb-2" style={{ color: styles.textColor || '#fff' }}>{content.headline}</h2>
            <p className="mb-4 opacity-90" style={{ color: styles.textColor || '#fff' }}>{content.subheadline}</p>
            {content.showIncentive && content.incentive && <p className="text-sm mb-4 font-semibold" style={{ color: styles.buttonColor || '#fff' }}>🎁 {content.incentive}</p>}
            <div className="flex gap-2 max-w-md mx-auto mb-3">
              <input type="email" placeholder={content.placeholder} className="flex-1 px-4 py-3 rounded-full border-0 text-gray-700" style={{ borderRadius: styles.inputStyle === 'pill' ? 9999 : styles.inputStyle === 'underline' ? 0 : 8 }} />
              <button className="px-6 py-3 font-semibold" style={{ background: styles.buttonColor || '#fff', color: styles.buttonTextColor || '#4F46E5', borderRadius: styles.inputStyle === 'pill' ? 9999 : 8 }}>{content.buttonText}</button>
            </div>
            <p className="text-xs opacity-70" style={{ color: styles.textColor || '#fff' }}>{content.privacyText}</p>
          </div>
        );

      default:
        return (
          <div className={wrapperClass} style={{ padding: 20, background: '#f9fafb', textAlign: 'center' }}>
            <p className="text-gray-500 text-sm">🧩 {BLOCK_INFO[type]?.label || type} Block</p>
            <p className="text-gray-400 text-xs mt-1">{BLOCK_INFO[type]?.description || 'Click to configure'}</p>
          </div>
        );
    }
  };

  // Style editor panel
  const StyleEditor = ({ block }: { block: EmailBlock }) => {
    const { type, content, styles } = block;
    const Icon = BLOCK_INFO[type].icon;

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-700/50">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{BLOCK_INFO[type].label}</h3>
            <p className="text-xs text-slate-400">Edit block settings</p>
          </div>
        </div>

        {/* Text block */}
        {type === 'text' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Content</label>
              <textarea
                value={content.text}
                onChange={(e) => updateBlockContent(block.id, { text: e.target.value })}
                className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white resize-none focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
                rows={4}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Font Size</label>
                <input type="number" value={styles.fontSize} onChange={(e) => updateBlockStyles(block.id, { fontSize: +e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Text Color</label>
                <input type="color" value={styles.color} onChange={(e) => updateBlockStyles(block.id, { color: e.target.value })} className="w-full h-10 rounded-lg border border-slate-600/50 cursor-pointer bg-slate-700/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Alignment</label>
              <div className="flex gap-2">
                {['left', 'center', 'right'].map(a => (
                  <button key={a} onClick={() => updateBlockStyles(block.id, { textAlign: a })} className={`flex-1 p-2 rounded-lg border ${styles.textAlign === a ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'border-slate-600/50 text-slate-400 hover:bg-slate-700/50'}`}>
                    {a === 'left' && <FiAlignLeft className="mx-auto" />}
                    {a === 'center' && <FiAlignCenter className="mx-auto" />}
                    {a === 'right' && <FiAlignRight className="mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Image block */}
        {type === 'image' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Image</label>
              <button onClick={() => openMediaLibrary(block.id, 'src')} className="w-full p-4 border-2 border-dashed border-slate-600/50 rounded-xl hover:border-violet-500/50 hover:bg-violet-500/10 transition-colors">
                {content.src ? (
                  <img src={content.src} alt="" className="max-h-32 mx-auto rounded-lg" />
                ) : (
                  <div className="text-center text-slate-400">
                    <FiImage size={32} className="mx-auto mb-2" />
                    <span className="text-sm">Choose from Media Library</span>
                  </div>
                )}
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Alt Text</label>
              <input type="text" value={content.alt} onChange={(e) => updateBlockContent(block.id, { alt: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Link URL (optional)</label>
              <input type="text" value={content.link} onChange={(e) => updateBlockContent(block.id, { link: e.target.value })} placeholder="https://..." className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Border Radius</label>
              <input type="range" min="0" max="24" value={styles.borderRadius} onChange={(e) => updateBlockStyles(block.id, { borderRadius: +e.target.value })} className="w-full accent-violet-500" />
            </div>
          </>
        )}

        {/* Button block */}
        {type === 'button' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Button Text</label>
              <input type="text" value={content.text} onChange={(e) => updateBlockContent(block.id, { text: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Link URL</label>
              <input type="text" value={content.link} onChange={(e) => updateBlockContent(block.id, { link: e.target.value })} placeholder="https://..." className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Button Color</label>
                <input type="color" value={styles.backgroundColor} onChange={(e) => updateBlockStyles(block.id, { backgroundColor: e.target.value })} className="w-full h-10 rounded-lg border border-slate-600/50 cursor-pointer bg-slate-700/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Text Color</label>
                <input type="color" value={styles.textColor} onChange={(e) => updateBlockStyles(block.id, { textColor: e.target.value })} className="w-full h-10 rounded-lg border border-slate-600/50 cursor-pointer bg-slate-700/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Border Radius</label>
              <input type="range" min="0" max="24" value={styles.borderRadius} onChange={(e) => updateBlockStyles(block.id, { borderRadius: +e.target.value })} className="w-full accent-violet-500" />
            </div>
          </>
        )}

        {/* Header block */}
        {type === 'header' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Logo</label>
              <button onClick={() => openMediaLibrary(block.id, 'logoUrl')} className="w-full p-4 border-2 border-dashed border-slate-600/50 rounded-xl hover:border-violet-500/50 hover:bg-violet-500/10 transition-colors">
                {content.logoUrl ? (
                  <img src={content.logoUrl} alt="" className="max-h-16 mx-auto" />
                ) : (
                  <div className="text-center text-slate-400">
                    <FiImage size={24} className="mx-auto mb-1" />
                    <span className="text-sm">Add Logo</span>
                  </div>
                )}
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
              <input type="text" value={content.title} onChange={(e) => updateBlockContent(block.id, { title: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Logo Size: {styles.logoSize || 48}px</label>
              <input type="range" min="24" max="120" value={styles.logoSize || 48} onChange={(e) => updateBlockStyles(block.id, { logoSize: +e.target.value })} className="w-full accent-violet-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Background</label>
                <input type="color" value={styles.backgroundColor || '#ffffff'} onChange={(e) => updateBlockStyles(block.id, { backgroundColor: e.target.value })} className="w-full h-10 rounded-lg border border-slate-600/50 cursor-pointer bg-slate-700/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Text Color</label>
                <input type="color" value={styles.textColor || '#1f2937'} onChange={(e) => updateBlockStyles(block.id, { textColor: e.target.value })} className="w-full h-10 rounded-lg border border-slate-600/50 cursor-pointer bg-slate-700/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Alignment</label>
              <div className="flex gap-2">
                {['left', 'center', 'right'].map(a => (
                  <button key={a} onClick={() => updateBlockStyles(block.id, { textAlign: a })} className={`flex-1 p-2 rounded-lg border ${styles.textAlign === a ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'border-slate-600/50 text-slate-400 hover:bg-slate-700/50'}`}>
                    {a === 'left' && <FiAlignLeft className="mx-auto" />}
                    {a === 'center' && <FiAlignCenter className="mx-auto" />}
                    {a === 'right' && <FiAlignRight className="mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Hero block */}
        {type === 'hero' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
              <input type="text" value={content.title} onChange={(e) => updateBlockContent(block.id, { title: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Subtitle</label>
              <textarea value={content.subtitle} onChange={(e) => updateBlockContent(block.id, { subtitle: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Button Text</label>
                <input type="text" value={content.buttonText} onChange={(e) => updateBlockContent(block.id, { buttonText: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Button Link</label>
                <input type="text" value={content.buttonLink} onChange={(e) => updateBlockContent(block.id, { buttonLink: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
              </div>
            </div>
          </>
        )}

        {/* CTA block */}
        {type === 'cta' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Title</label>
              <input type="text" value={content.title} onChange={(e) => updateBlockContent(block.id, { title: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Subtitle</label>
              <input type="text" value={content.subtitle} onChange={(e) => updateBlockContent(block.id, { subtitle: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Button Text</label>
                <input type="text" value={content.buttonText} onChange={(e) => updateBlockContent(block.id, { buttonText: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Button Link</label>
                <input type="text" value={content.buttonLink} onChange={(e) => updateBlockContent(block.id, { buttonLink: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
              </div>
            </div>
          </>
        )}

        {/* Footer block */}
        {type === 'footer' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Company Name</label>
              <input type="text" value={content.companyName} onChange={(e) => updateBlockContent(block.id, { companyName: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Address</label>
              <input type="text" value={content.address} onChange={(e) => updateBlockContent(block.id, { address: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Unsubscribe Text</label>
              <input type="text" value={content.unsubscribeText} onChange={(e) => updateBlockContent(block.id, { unsubscribeText: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Background</label>
                <input type="color" value={styles.backgroundColor || '#1f2937'} onChange={(e) => updateBlockStyles(block.id, { backgroundColor: e.target.value })} className="w-full h-10 rounded-lg border border-slate-600/50 cursor-pointer bg-slate-700/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Text Color</label>
                <input type="color" value={styles.color || '#9ca3af'} onChange={(e) => updateBlockStyles(block.id, { color: e.target.value })} className="w-full h-10 rounded-lg border border-slate-600/50 cursor-pointer bg-slate-700/50" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Font Size: {styles.fontSize || 14}px</label>
              <input type="range" min="10" max="18" value={styles.fontSize || 14} onChange={(e) => updateBlockStyles(block.id, { fontSize: +e.target.value })} className="w-full accent-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Alignment</label>
              <div className="flex gap-2">
                {['left', 'center', 'right'].map(a => (
                  <button key={a} onClick={() => updateBlockStyles(block.id, { textAlign: a })} className={`flex-1 p-2 rounded-lg border ${styles.textAlign === a ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'border-slate-600/50 text-slate-400 hover:bg-slate-700/50'}`}>
                    {a === 'left' && <FiAlignLeft className="mx-auto" />}
                    {a === 'center' && <FiAlignCenter className="mx-auto" />}
                    {a === 'right' && <FiAlignRight className="mx-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Testimonial block */}
        {type === 'testimonial' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Quote</label>
              <textarea value={content.quote} onChange={(e) => updateBlockContent(block.id, { quote: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Author</label>
                <input type="text" value={content.author} onChange={(e) => updateBlockContent(block.id, { author: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Role</label>
                <input type="text" value={content.role} onChange={(e) => updateBlockContent(block.id, { role: e.target.value })} className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white" />
              </div>
            </div>
          </>
        )}

        {/* Spacer block */}
        {type === 'spacer' && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Height: {styles.height}px</label>
            <input type="range" min="16" max="120" value={styles.height} onChange={(e) => updateBlockStyles(block.id, { height: +e.target.value })} className="w-full accent-violet-500" />
          </div>
        )}

        {/* Divider block */}
        {type === 'divider' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Color</label>
              <input type="color" value={styles.color} onChange={(e) => updateBlockStyles(block.id, { color: e.target.value })} className="w-full h-10 rounded-lg border border-slate-600/50 cursor-pointer bg-slate-700/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Thickness: {styles.thickness}px</label>
              <input type="range" min="1" max="8" value={styles.thickness} onChange={(e) => updateBlockStyles(block.id, { thickness: +e.target.value })} className="w-full accent-violet-500" />
            </div>
          </>
        )}

        {/* Social block */}
        {type === 'social' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Section Title</label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => updateBlockContent(block.id, { title: e.target.value })}
                placeholder="Follow Us"
                className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Social Platforms</label>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {(content.links || []).map((link: SocialLink, idx: number) => {
                  const platform = SOCIAL_PLATFORMS[link.platform];
                  if (!platform) return null;
                  return (
                    <div key={link.platform} className={`p-3 rounded-lg border transition-colors ${link.enabled ? 'bg-slate-700/50 border-violet-500/50' : 'bg-slate-800/50 border-slate-600/30'}`}>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const newLinks = [...content.links];
                            newLinks[idx] = { ...newLinks[idx], enabled: !link.enabled };
                            updateBlockContent(block.id, { links: newLinks });
                          }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${link.enabled ? '' : 'opacity-40'}`}
                          style={{ backgroundColor: platform.color }}
                        >
                          <div className="w-4 h-4 text-white" dangerouslySetInnerHTML={{ __html: platform.icon }} />
                        </button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${link.enabled ? 'text-white' : 'text-slate-500'}`}>{platform.name}</span>
                            {link.enabled && <FiCheck size={14} className="text-green-400" />}
                          </div>
                          {link.enabled && (
                            <input
                              type="text"
                              value={link.url}
                              onChange={(e) => {
                                const newLinks = [...content.links];
                                newLinks[idx] = { ...newLinks[idx], url: e.target.value };
                                updateBlockContent(block.id, { links: newLinks });
                              }}
                              placeholder={`https://${link.platform}.com/yourpage`}
                              className="w-full mt-1 p-1.5 bg-slate-600/50 border border-slate-500/50 rounded text-xs text-white placeholder-slate-400"
                            />
                          )}
                        </div>
                        {/* Remove Platform Button */}
                        <button
                          onClick={() => {
                            const newLinks = content.links.filter((_: SocialLink, i: number) => i !== idx);
                            updateBlockContent(block.id, { links: newLinks });
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove platform"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Platform Dropdown */}
              {(() => {
                const existingPlatforms = (content.links || []).map((l: SocialLink) => l.platform);
                const availablePlatforms = Object.keys(SOCIAL_PLATFORMS).filter(p => !existingPlatforms.includes(p as SocialPlatform)) as SocialPlatform[];

                if (availablePlatforms.length === 0) return null;

                return (
                  <div className="mt-3 space-y-2">
                    <label className="block text-xs font-medium text-slate-500">Add New Platform</label>
                    <div className="flex gap-2">
                      <select
                        id={`social-platform-select-${block.id}`}
                        className="flex-1 p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
                        defaultValue=""
                        onChange={(e) => {
                          const newPlatform = e.target.value as SocialPlatform;
                          if (newPlatform) {
                            updateBlockContent(block.id, {
                              links: [...(content.links || []), { platform: newPlatform, url: `https://${newPlatform}.com/`, enabled: true }]
                            });
                            e.target.value = ''; // Reset select
                          }
                        }}
                      >
                        <option value="" disabled>Select a platform...</option>
                        {availablePlatforms.map(p => (
                          <option key={p} value={p}>{SOCIAL_PLATFORMS[p].name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Icon Style</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'colored', label: 'Colored' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' }
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateBlockStyles(block.id, { iconStyle: opt.value })}
                    className={`p-2 rounded-lg border text-xs font-medium transition-colors ${styles.iconStyle === opt.value ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'border-slate-600/50 text-slate-400 hover:bg-slate-700/50'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Icon Size: {styles.iconSize || 32}px</label>
                <input
                  type="range"
                  min="24"
                  max="56"
                  value={styles.iconSize || 32}
                  onChange={(e) => updateBlockStyles(block.id, { iconSize: +e.target.value })}
                  className="w-full accent-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Spacing: {styles.iconSpacing || 12}px</label>
                <input
                  type="range"
                  min="4"
                  max="32"
                  value={styles.iconSpacing || 12}
                  onChange={(e) => updateBlockStyles(block.id, { iconSpacing: +e.target.value })}
                  className="w-full accent-violet-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Background Color</label>
              <input
                type="color"
                value={styles.backgroundColor || '#f9fafb'}
                onChange={(e) => updateBlockStyles(block.id, { backgroundColor: e.target.value })}
                className="w-full h-10 rounded-lg border border-slate-600/50 cursor-pointer bg-slate-700/50"
              />
            </div>
          </>
        )}

        {/* Columns block */}
        {type === 'columns' && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Number of Columns</label>
              <div className="grid grid-cols-3 gap-2">
                {[2, 3, 4].map(num => (
                  <button
                    key={num}
                    onClick={() => updateBlockContent(block.id, { columns: num })}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${content.columns === num ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'border-slate-600/50 text-slate-400 hover:bg-slate-700/50'}`}
                  >
                    <FiColumns size={16} /> {num}
                  </button>
                ))}
              </div>
            </div>

            {Array.from({ length: content.columns || 2 }, (_, i) => (
              <div key={i}>
                <label className="block text-xs font-medium text-slate-400 mb-1">Column {i + 1} Content</label>
                <textarea
                  value={content[`column${i + 1}`] || ''}
                  onChange={(e) => updateBlockContent(block.id, { [`column${i + 1}`]: e.target.value })}
                  placeholder={`Enter content for column ${i + 1}...`}
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500 resize-none"
                  rows={2}
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Column Gap: {styles.gap || 16}px</label>
              <input
                type="range"
                min="0"
                max="40"
                value={styles.gap || 16}
                onChange={(e) => updateBlockStyles(block.id, { gap: +e.target.value })}
                className="w-full accent-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Background Color</label>
              <input
                type="color"
                value={styles.backgroundColor || '#ffffff'}
                onChange={(e) => updateBlockStyles(block.id, { backgroundColor: e.target.value })}
                className="w-full h-10 rounded-lg border border-slate-600/50 cursor-pointer bg-slate-700/50"
              />
            </div>
          </>
        )}

        {/* Common padding */}
        {styles.padding !== undefined && (
          <div className="pt-4 border-t border-slate-700/50">
            <label className="block text-xs font-medium text-slate-400 mb-1">Padding: {styles.padding}px</label>
            <input type="range" min="0" max="80" value={styles.padding} onChange={(e) => updateBlockStyles(block.id, { padding: +e.target.value })} className="w-full accent-violet-500" />
          </div>
        )}

        {/* Conditional Content */}
        <div className="pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <FiCheck size={14} /> Conditional Display
            </label>
            <button
              onClick={() => {
                const conditional = block.conditional?.enabled
                  ? { ...block.conditional, enabled: false }
                  : { enabled: true, field: 'user.name', operator: 'exists' as const, value: '' };
                setDesign(prev => ({
                  ...prev,
                  blocks: prev.blocks.map(b => b.id === block.id ? { ...b, conditional } : b)
                }));
              }}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${block.conditional?.enabled ? 'bg-violet-500/20 text-violet-400 border border-violet-500/50' : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'}`}
            >
              {block.conditional?.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
          {block.conditional?.enabled && (
            <div className="space-y-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600/30">
              <p className="text-xs text-slate-400">Show this block only when:</p>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={block.conditional.field}
                  onChange={(e) => setDesign(prev => ({
                    ...prev,
                    blocks: prev.blocks.map(b => b.id === block.id ? { ...b, conditional: { ...b.conditional!, field: e.target.value } } : b)
                  }))}
                  className="p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
                >
                  <optgroup label="User Data">
                    <option value="user.name">User Name</option>
                    <option value="user.email">User Email</option>
                    <option value="user.role">User Role</option>
                  </optgroup>
                  <optgroup label="E-commerce">
                    <option value="order.total">Order Total</option>
                    <option value="order.items">Order Items</option>
                    <option value="cart.abandoned">Cart Abandoned</option>
                    <option value="customer.purchases">Total Purchases</option>
                  </optgroup>
                  <optgroup label="Courses">
                    <option value="course.enrolled">Course Enrolled</option>
                    <option value="course.progress">Course Progress</option>
                    <option value="course.completed">Course Completed</option>
                  </optgroup>
                  <optgroup label="Custom">
                    <option value="custom">Custom Field</option>
                  </optgroup>
                </select>
                <select
                  value={block.conditional.operator}
                  onChange={(e) => setDesign(prev => ({
                    ...prev,
                    blocks: prev.blocks.map(b => b.id === block.id ? { ...b, conditional: { ...b.conditional!, operator: e.target.value as any } } : b)
                  }))}
                  className="p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white"
                >
                  <option value="exists">Exists</option>
                  <option value="equals">Equals</option>
                  <option value="notEquals">Not Equals</option>
                  <option value="contains">Contains</option>
                  <option value="greaterThan">Greater Than</option>
                  <option value="lessThan">Less Than</option>
                </select>
              </div>
              {block.conditional.operator !== 'exists' && (
                <input
                  type="text"
                  value={block.conditional.value}
                  onChange={(e) => setDesign(prev => ({
                    ...prev,
                    blocks: prev.blocks.map(b => b.id === block.id ? { ...b, conditional: { ...b.conditional!, value: e.target.value } } : b)
                  }))}
                  placeholder="Value to compare..."
                  className="w-full p-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white placeholder-slate-500"
                />
              )}
              <p className="text-xs text-slate-500">
                💡 Use merge tags like {'{{user.name}}'} in your content
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Top toolbar */}
      <div className="bg-slate-800/80 backdrop-blur border-b border-slate-700/50 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            Email Designer
          </h1>
          <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
            <button onClick={() => setPreviewMode('desktop')} className={`p-2 rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-slate-600 text-violet-400' : 'text-slate-400 hover:text-white'}`}>
              <FiMonitor size={18} />
            </button>
            <button onClick={() => setPreviewMode('mobile')} className={`p-2 rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-slate-600 text-violet-400' : 'text-slate-400 hover:text-white'}`}>
              <FiSmartphone size={18} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowTemplateLibrary(true)} className="flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-700 transition-colors">
            <FiLayout size={18} /> Templates
          </button>
          <button onClick={() => setShowPreviewModal(true)} className="flex items-center gap-2 px-4 py-2 text-slate-300 bg-slate-700/50 border border-slate-600/50 rounded-xl hover:bg-slate-700 transition-colors">
            <FiEye size={18} /> Preview
          </button>
          <button onClick={() => setShowSaveModal(true)} className="flex items-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl hover:from-violet-700 hover:to-purple-700 transition-colors shadow-lg shadow-violet-500/20">
            <FiSave size={18} /> Save Template
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar - Block palette */}
        <div className="w-72 bg-slate-800/50 backdrop-blur border-r border-slate-700/50 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Add Blocks</h2>
              <Tooltip
                title="💡 Block Palette"
                content="Click any block to add it to your email. Hover over blocks to learn what they do."
                position="bottom"
                variant="help"
              >
                <FiHelpCircle size={14} className="text-slate-500 hover:text-violet-400 cursor-help" />
              </Tooltip>
            </div>
            {Object.entries(BLOCK_CATEGORIES).map(([category, types]) => (
              <div key={category} className="mb-6">
                <h3 className="text-xs font-medium text-slate-500 uppercase mb-3">{category}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {types.map(type => {
                    const info = BLOCK_INFO[type];
                    const tooltip = BLOCK_TOOLTIPS[type];
                    const Icon = info.icon;
                    return (
                      <Tooltip
                        key={type}
                        title={tooltip.title}
                        content={<div><p>{tooltip.content}</p>{tooltip.example && <p className="mt-1 text-xs text-slate-400 italic">{tooltip.example}</p>}</div>}
                        position="right"
                        variant="help"
                        delay={200}
                      >
                        <button
                          onClick={() => addBlock(type)}
                          className="w-full flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed border-slate-600/50 hover:border-violet-500/50 hover:bg-violet-500/10 transition-all group"
                        >
                          <div className="w-10 h-10 rounded-lg bg-slate-700/50 group-hover:bg-violet-500/20 flex items-center justify-center text-slate-400 group-hover:text-violet-400 transition-colors">
                            <Icon size={20} />
                          </div>
                          <span className="text-xs font-medium text-slate-400 group-hover:text-violet-400">{info.label}</span>
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center - Canvas */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-900/50">
          <div
            className="mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ring-1 ring-slate-700/50"
            style={{ width: previewMode === 'mobile' ? 375 : design.globalStyles.contentWidth, maxWidth: '100%' }}
          >
            {design.blocks.length === 0 ? (
              <div className="p-16 text-center bg-slate-800">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                  <FiPlus size={32} className="text-violet-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Start Building</h3>
                <p className="text-slate-400 mb-6">Click on blocks from the left panel to add them here</p>
                <button onClick={() => addBlock('hero')} className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-purple-700 transition-colors shadow-lg shadow-violet-500/20">
                  Add Hero Section
                </button>
              </div>
            ) : (
              design.blocks.map((block, index) => (
                <div key={block.id} className="relative group" onClick={() => setSelectedBlockId(block.id)}>
                  {renderBlockPreview(block)}
                  {/* Block controls */}
                  <div className={`absolute top-2 right-2 flex gap-1 transition-opacity ${selectedBlockId === block.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up'); }} disabled={index === 0} className="p-1.5 bg-slate-800 rounded-lg shadow-md hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed">
                      <FiArrowUp size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down'); }} disabled={index === design.blocks.length - 1} className="p-1.5 bg-slate-800 rounded-lg shadow-md hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed">
                      <FiArrowDown size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id); }} className="p-1.5 bg-slate-800 rounded-lg shadow-md hover:bg-slate-700 text-slate-300">
                      <FiCopy size={14} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }} className="p-1.5 bg-slate-800 rounded-lg shadow-md hover:bg-red-500/20 text-red-400">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right sidebar - Style editor */}
        <div className="w-80 bg-slate-800/50 backdrop-blur border-l border-slate-700/50 overflow-y-auto">
          <div className="p-5">
            {selectedBlock ? (
              <StyleEditor block={selectedBlock} />
            ) : (
              <>
                <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Global Styles</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Background Color</label>
                    <input type="color" value={design.globalStyles.backgroundColor} onChange={(e) => updateGlobalStyles({ backgroundColor: e.target.value })} className="w-full h-10 rounded-lg border border-slate-600/50 cursor-pointer bg-slate-700/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Primary Color</label>
                    <input type="color" value={design.globalStyles.primaryColor} onChange={(e) => updateGlobalStyles({ primaryColor: e.target.value })} className="w-full h-10 rounded-lg border border-slate-600/50 cursor-pointer bg-slate-700/50" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Content Width</label>
                    <input type="number" value={design.globalStyles.contentWidth} onChange={(e) => updateGlobalStyles({ contentWidth: +e.target.value })} className="w-full p-2 border border-slate-600/50 rounded-lg text-sm bg-slate-700/50 text-white" min={400} max={800} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Font Family</label>
                    <select value={design.globalStyles.fontFamily} onChange={(e) => updateGlobalStyles({ fontFamily: e.target.value })} className="w-full p-2 border border-slate-600/50 rounded-lg text-sm bg-slate-700/50 text-white">
                      {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="mt-8 p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-xl border border-violet-500/20">
                  <p className="text-sm text-slate-300 text-center">
                    <span className="font-medium text-violet-400">Tip:</span> Click on a block in the canvas to edit its content and styles
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-slate-700/50">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white">Email Preview</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
                  <button onClick={() => setPreviewMode('desktop')} className={`p-2 rounded-md ${previewMode === 'desktop' ? 'bg-slate-600 text-violet-400' : 'text-slate-400'}`}>
                    <FiMonitor size={16} />
                  </button>
                  <button onClick={() => setPreviewMode('mobile')} className={`p-2 rounded-md ${previewMode === 'mobile' ? 'bg-slate-600 text-violet-400' : 'text-slate-400'}`}>
                    <FiSmartphone size={16} />
                  </button>
                </div>
                <button onClick={() => setShowPreviewModal(false)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                  <FiX size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-slate-900/50">
              <div className="mx-auto transition-all" style={{ width: previewMode === 'mobile' ? 375 : design.globalStyles.contentWidth }}>
                <iframe
                  srcDoc={generateHtml()}
                  className="w-full h-[600px] bg-white rounded-lg shadow-lg border-0"
                  title="Email Preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Save Template</h2>
              <button onClick={() => setShowSaveModal(false)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => { setTemplateName(e.target.value); setTemplateSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }}
                  placeholder="Welcome Email"
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Slug *</label>
                <input
                  type="text"
                  value={templateSlug}
                  onChange={(e) => setTemplateSlug(e.target.value)}
                  placeholder="welcome-email"
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Subject Line</label>
                <input
                  type="text"
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  placeholder="Welcome to {{site.name}}!"
                  className="w-full p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !templateName || !templateSlug}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20"
              >
                {saving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave size={18} />
                    Save Template
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col border border-slate-700/50">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h2 className="text-lg font-semibold text-white">Media Library</h2>
              <button onClick={() => { setShowMediaModal(false); setMediaTarget(null); }} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-slate-700/50">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={mediaSearch}
                  onChange={(e) => setMediaSearch(e.target.value)}
                  placeholder="Search images..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-violet-500/50 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-900/30">
              {filteredMedia.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FiImage size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No images found in your media library</p>
                  <p className="text-sm mt-2 text-slate-500">Upload images via Media → Library</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {filteredMedia.map(item => (
                    <button
                      key={item.id}
                      onClick={() => selectMedia(item)}
                      className="aspect-square rounded-xl overflow-hidden border-2 border-slate-600/50 hover:border-violet-500 transition-colors group relative"
                    >
                      <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium bg-violet-600 px-3 py-1 rounded-lg">Select</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-slate-700/50">
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <div>
                <h2 className="text-lg font-semibold text-white">Template Library</h2>
                <p className="text-sm text-slate-400">Start with a professionally designed template</p>
              </div>
              <button onClick={() => setShowTemplateLibrary(false)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white">
                <FiX size={20} />
              </button>
            </div>
            <div className="p-4 border-b border-slate-700/50">
              <div className="flex gap-2">
                {['all', 'ecommerce', 'education', 'blog', 'saas'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setTemplateFilter(cat)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${templateFilter === cat ? 'bg-violet-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                  >
                    {cat === 'all' ? '🎨 All' : cat === 'ecommerce' ? '🛒 E-commerce' : cat === 'education' ? '🎓 Education' : cat === 'blog' ? '📝 Blog' : '💻 SaaS'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-slate-900/30">
              <div className="grid grid-cols-3 gap-4">
                {TEMPLATE_PRESETS.filter(t => templateFilter === 'all' || t.category === templateFilter).map(template => (
                  <button
                    key={template.id}
                    onClick={() => loadTemplatePreset(template.id)}
                    className="p-4 bg-slate-700/30 rounded-xl border border-slate-600/50 hover:border-violet-500 hover:bg-slate-700/50 transition-all text-left group"
                  >
                    <div className="text-3xl mb-3">{template.icon}</div>
                    <h3 className="font-semibold text-white group-hover:text-violet-400 transition-colors">{template.name}</h3>
                    <p className="text-sm text-slate-400 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-700/50 text-center">
              <p className="text-sm text-slate-400">Templates are fully customizable after loading</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}