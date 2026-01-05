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

// Types
export type BlockType = 'header' | 'text' | 'image' | 'button' | 'divider' | 'spacer' | 'footer' | 'hero' | 'social' | 'features' | 'cta' | 'testimonial' | 'columns';

export interface EmailBlock {
  id: string;
  type: BlockType;
  content: Record<string, any>;
  styles: Record<string, any>;
}

export interface EmailDesign {
  blocks: EmailBlock[];
  globalStyles: {
    backgroundColor: string;
    contentWidth: number;
    fontFamily: string;
    primaryColor: string;
    textColor: string;
    linkColor: string;
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

// Default block configurations
const DEFAULT_BLOCKS: Record<BlockType, Partial<EmailBlock>> = {
  header: {
    content: { logoUrl: '', title: 'Your Brand' },
    styles: { backgroundColor: '#ffffff', padding: 32, textAlign: 'center' }
  },
  text: {
    content: { text: 'Write your message here.' },
    styles: { backgroundColor: '#ffffff', padding: 24, fontSize: 16, lineHeight: 1.7, textAlign: 'left', color: '#374151' }
  },
  image: {
    content: { src: '', alt: 'Image', link: '' },
    styles: { backgroundColor: '#ffffff', padding: 16, borderRadius: 8 }
  },
  button: {
    content: { text: 'Get Started', link: '#' },
    styles: { backgroundColor: '#4F46E5', textColor: '#ffffff', padding: 16, borderRadius: 8, fontSize: 16, align: 'center' }
  },
  divider: {
    content: {},
    styles: { color: '#e5e7eb', thickness: 1, padding: 24 }
  },
  spacer: {
    content: {},
    styles: { height: 40 }
  },
  footer: {
    content: { companyName: '{{site.name}}', address: '123 Main St', unsubscribeText: 'Unsubscribe' },
    styles: { backgroundColor: '#1f2937', padding: 40, textAlign: 'center', color: '#9ca3af' }
  },
  hero: {
    content: { title: 'Welcome!', subtitle: 'Discover something amazing.', buttonText: 'Get Started', buttonLink: '#' },
    styles: { backgroundColor: '#4F46E5', textColor: '#ffffff', padding: 64, textAlign: 'center' }
  },
  social: {
    content: {
      title: 'Follow Us',
      links: [
        { platform: 'facebook', url: 'https://facebook.com/', enabled: true },
        { platform: 'twitter', url: 'https://x.com/', enabled: true },
        { platform: 'instagram', url: 'https://instagram.com/', enabled: true },
        { platform: 'linkedin', url: 'https://linkedin.com/', enabled: false },
        { platform: 'youtube', url: 'https://youtube.com/', enabled: false },
        { platform: 'tiktok', url: 'https://tiktok.com/', enabled: false },
      ]
    },
    styles: { backgroundColor: '#f9fafb', padding: 32, align: 'center', iconSize: 32, iconSpacing: 12, iconStyle: 'colored' }
  },
  features: {
    content: { title: 'Features', features: [{ icon: '⚡', title: 'Fast', desc: 'Quick' }] },
    styles: { backgroundColor: '#ffffff', padding: 40 }
  },
  cta: {
    content: { title: 'Ready?', subtitle: 'Join now.', buttonText: 'Start', buttonLink: '#' },
    styles: { backgroundColor: '#f3f4f6', padding: 48, textAlign: 'center' }
  },
  testimonial: {
    content: { quote: '"Amazing!"', author: 'Jane', role: 'CEO' },
    styles: { backgroundColor: '#ffffff', padding: 40, textAlign: 'center' }
  },
  columns: {
    content: {
      columns: 2,
      column1: 'Left column content',
      column2: 'Right column content',
      column3: 'Third column content'
    },
    styles: { backgroundColor: '#ffffff', padding: 24, gap: 16 }
  }
};

const BLOCK_CATEGORIES: Record<string, BlockType[]> = {
  'Layout': ['header', 'footer', 'divider', 'spacer', 'columns'],
  'Content': ['text', 'image', 'button'],
  'Marketing': ['hero', 'cta', 'features', 'testimonial', 'social']
};

const BLOCK_INFO: Record<BlockType, { label: string; icon: any }> = {
  header: { label: 'Header', icon: FiLayout },
  text: { label: 'Text', icon: FiType },
  image: { label: 'Image', icon: FiImage },
  button: { label: 'Button', icon: FiSquare },
  divider: { label: 'Divider', icon: FiMinus },
  spacer: { label: 'Spacer', icon: FiGrid },
  footer: { label: 'Footer', icon: FiLayout },
  hero: { label: 'Hero', icon: FiStar },
  social: { label: 'Social', icon: FiLink },
  features: { label: 'Features', icon: FiCheck },
  cta: { label: 'CTA', icon: FiMail },
  testimonial: { label: 'Quote', icon: FiStar },
  columns: { label: 'Columns', icon: FiColumns }
};

// Block tooltips for user guidance
const BLOCK_TOOLTIPS: Record<BlockType, { title: string; content: string; example?: string }> = {
  header: {
    title: '📌 Header Block',
    content: 'Add your company logo and brand name at the top of your email.',
    example: 'Use for: Brand identity, email header'
  },
  text: {
    title: '✏️ Text Block',
    content: 'Add formatted text content like paragraphs, headings, or descriptions.',
    example: 'Use for: Messages, descriptions, instructions'
  },
  image: {
    title: '🖼️ Image Block',
    content: 'Insert images from your media library with optional link.',
    example: 'Use for: Product photos, banners, graphics'
  },
  button: {
    title: '🔘 Button Block',
    content: 'Add a clickable call-to-action button with customizable colors.',
    example: 'Use for: CTAs, links, navigation'
  },
  divider: {
    title: '➖ Divider Block',
    content: 'Add a horizontal line to separate sections of your email.',
    example: 'Use for: Visual separation between content'
  },
  spacer: {
    title: '↕️ Spacer Block',
    content: 'Add vertical spacing between blocks for better readability.',
    example: 'Use for: Improving layout and breathing room'
  },
  footer: {
    title: '🦶 Footer Block',
    content: 'Add company info, address, and unsubscribe link at the bottom.',
    example: 'Use for: Legal info, contact details, unsubscribe'
  },
  hero: {
    title: '⭐ Hero Block',
    content: 'Create an eye-catching banner with title, subtitle, and button.',
    example: 'Use for: Main message, announcements, promotions'
  },
  social: {
    title: '🔗 Social Block',
    content: 'Add social media icons linking to your profiles.',
    example: 'Use for: Social media links, community building'
  },
  features: {
    title: '✨ Features Block',
    content: 'Showcase multiple features or benefits in a grid layout.',
    example: 'Use for: Product features, service highlights'
  },
  cta: {
    title: '📣 CTA Block',
    content: 'Create a prominent call-to-action section with heading and button.',
    example: 'Use for: Conversions, sign-ups, purchases'
  },
  testimonial: {
    title: '💬 Quote Block',
    content: 'Display a customer testimonial or quote with attribution.',
    example: 'Use for: Social proof, reviews, endorsements'
  },
  columns: {
    title: '📊 Columns Block',
    content: 'Create multi-column layouts for side-by-side content.',
    example: 'Use for: Comparisons, multiple items, organized content'
  }
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
    textColor: '#333333',
    linkColor: '#4F46E5'
  }
};

export default function EmailTemplateDesigner() {
  const [design, setDesign] = useState<EmailDesign>(DEFAULT_DESIGN);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<{ blockId: string; field: string } | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateSlug, setTemplateSlug] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedBlock = design.blocks.find(b => b.id === selectedBlockId);

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

        default:
          return '';
      }
    };

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Email</title></head>
<body style="margin:0;padding:0;background:${globalStyles.backgroundColor};font-family:${globalStyles.fontFamily};">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${globalStyles.backgroundColor};">
<tr><td align="center" style="padding:20px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="${globalStyles.contentWidth}" style="max-width:${globalStyles.contentWidth}px;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
${blocks.map(renderBlock).join('')}
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

      default:
        return <div className={wrapperClass} style={{ padding: 20 }}>Unknown block</div>;
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
    </div>
  );
}