/**
 * AI Theme Generator Service - Enhanced Version
 * Generates comprehensive, production-ready theme configurations using AI
 * Supports full theme structure with content blocks, templates, and assets
 * Falls back to beautiful presets when AI is not configured
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomThemeSettings, ThemePageData, ContentBlockData } from './custom-themes.service';
import {
  GenerateAiThemeDto,
  PageType,
  ContentBlockType,
  IndustryType,
} from './dto/generate-ai-theme.dto';
import { v4 as uuid } from 'uuid';
import {
  AI_THEME_PRESETS,
  AiThemePreset,
  getPresetsByIndustry,
  searchPresets,
} from './ai-theme-presets';

/**
 * Extended theme data with full theme structure
 */
export interface GeneratedThemeData {
  settings: CustomThemeSettings;
  pages: ThemePageData[];
  name: string;
  description: string;
  themeJson?: ThemeJsonConfig;
  templates?: Record<string, string>;
  css?: string;
  features?: string[];
  /** Indicates whether the theme was generated using AI or a preset */
  generatedBy: 'ai' | 'preset';
  /** The preset ID if generated from a preset */
  presetId?: string;
  /** The preset name if generated from a preset */
  presetName?: string;
}

/**
 * Theme.json configuration structure
 */
export interface ThemeJsonConfig {
  name: string;
  version: string;
  author: string;
  description: string;
  license: string;
  templates: string[];
  settings: {
    colors: Record<string, string>;
    typography: Record<string, any>;
    spacing: Record<string, any>;
  };
  features: string[];
  supports: {
    widgets: boolean;
    menus: boolean;
    customHeader: boolean;
    customBackground: boolean;
    postThumbnails: boolean;
    responsiveEmbeds: boolean;
    darkMode: boolean;
  };
}

@Injectable()
export class AiThemeGeneratorService {
  private aiProvider: 'openai' | 'anthropic';
  private openaiApiKey: string;
  private anthropicApiKey: string;
  private rateLimitMap: Map<string, number[]> = new Map();
  private isConfigured: boolean = false;

  constructor(private configService: ConfigService) {
    this.aiProvider = (this.configService.get('AI_PROVIDER') || 'openai') as 'openai' | 'anthropic';
    this.openaiApiKey = this.configService.get('OPENAI_API_KEY') || '';
    this.anthropicApiKey = this.configService.get('ANTHROPIC_API_KEY') || '';

    if (!this.openaiApiKey && !this.anthropicApiKey) {
      console.warn('AI Theme Generator: No API keys configured. AI features will be disabled.');
      this.isConfigured = false;
    } else {
      this.isConfigured = true;
    }
  }

  isAvailable(): boolean {
    return this.isConfigured;
  }

  private checkRateLimit(userId: string): boolean {
    const limit = parseInt(this.configService.get('AI_RATE_LIMIT') || '10');
    const window = parseInt(this.configService.get('AI_RATE_LIMIT_WINDOW') || '3600') * 1000;
    const now = Date.now();

    if (!this.rateLimitMap.has(userId)) {
      this.rateLimitMap.set(userId, []);
    }

    const timestamps = this.rateLimitMap.get(userId)!;
    const recentRequests = timestamps.filter((t) => now - t < window);

    if (recentRequests.length >= limit) {
      return false;
    }

    recentRequests.push(now);
    this.rateLimitMap.set(userId, recentRequests);
    return true;
  }

  /**
   * Generate comprehensive theme using AI or fallback to presets
   */
  async generateTheme(dto: GenerateAiThemeDto, userId: string): Promise<GeneratedThemeData> {
    // If a specific preset is requested, use it directly
    if (dto.usePreset && dto.presetId) {
      console.log(`Using preset directly: ${dto.presetId}`);
      return this.generateFromPresetById(dto.presetId, dto.themeName, dto.description);
    }

    // If AI is not configured, use preset-based generation (beautiful themes without AI)
    if (!this.isConfigured) {
      console.log('AI not configured, using preset-based theme generation');
      return this.generateFromPreset(dto);
    }

    if (!this.checkRateLimit(userId)) {
      throw new BadRequestException('Rate limit exceeded. Please try again later.');
    }

    try {
      if (this.aiProvider === 'openai' && this.openaiApiKey) {
        return await this.generateWithOpenAI(dto);
      } else if (this.aiProvider === 'anthropic' && this.anthropicApiKey) {
        return await this.generateWithAnthropic(dto);
      } else {
        // Fallback to preset-based generation
        return this.generateFromPreset(dto);
      }
    } catch (error: any) {
      // On AI failure, fallback to preset-based generation
      console.warn('AI generation failed, falling back to preset:', error.message);
      return this.generateFromPreset(dto);
    }
  }

  /**
   * Generate theme from a specific preset by ID
   */
  private generateFromPresetById(
    presetId: string,
    customName?: string,
    customDescription?: string,
  ): GeneratedThemeData {
    const preset = AI_THEME_PRESETS.find((p) => p.id === presetId);

    if (!preset) {
      throw new BadRequestException(`Preset not found: ${presetId}`);
    }

    // Use convertPresetToThemeData with minimal DTO to preserve preset settings
    return this.convertPresetToThemeData(preset, {
      themeName: customName,
      description: customDescription,
    });
  }

  /**
   * Generate theme from presets (works without AI)
   * Matches presets based on industry, style, prompt keywords, and color scheme
   */
  private generateFromPreset(dto: GenerateAiThemeDto): GeneratedThemeData {
    let preset: AiThemePreset | undefined;

    // Try to find matching preset by industry first
    if (dto.industry) {
      const industryPresets = getPresetsByIndustry(dto.industry);
      if (industryPresets.length > 0) {
        // Find best match based on style/colorScheme
        preset =
          industryPresets.find(
            (p) =>
              (dto.style ? p.style === dto.style : true) &&
              (dto.colorScheme ? p.colorScheme === dto.colorScheme : true),
          ) || industryPresets[0];
      }
    }

    // Try matching by prompt keywords
    if (!preset && dto.prompt) {
      const matchingPresets = searchPresets(dto.prompt);
      if (matchingPresets.length > 0) {
        preset = matchingPresets[0];
      }
    }

    // Default to a preset based on style/colorScheme
    if (!preset) {
      if (dto.colorScheme === 'dark') {
        preset = AI_THEME_PRESETS.find((p) => p.colorScheme === 'dark') || AI_THEME_PRESETS[0];
      } else if (dto.style === 'bold') {
        preset = AI_THEME_PRESETS.find((p) => p.style === 'bold') || AI_THEME_PRESETS[0];
      } else {
        // Default to Corporate Business or first available
        preset = AI_THEME_PRESETS.find((p) => p.id === 'corporate-business') || AI_THEME_PRESETS[0];
      }
    }

    // Convert preset to GeneratedThemeData
    return this.convertPresetToThemeData(preset, dto);
  }

  /**
   * Map unsupported preset block types to supported block types
   * This ensures blocks from presets render correctly in the ThemeDesigner
   */
  private mapBlockToSupportedType(block: { type: string; props: Record<string, any> }): {
    type: string;
    props: Record<string, any>;
  } {
    const { type, props } = block;

    // Block type mapping with prop transformations
    switch (type) {
      // Blog-related blocks -> use gallery or features blocks
      case 'blogPosts':
      case 'blogGrid': {
        // Convert blog posts to a gallery with cards
        const posts = props.posts || [];
        return {
          type: 'gallery',
          props: {
            layout: 'grid',
            columns: props.columns || 3,
            images: posts.slice(0, 6).map((post: any) => ({
              src: post.image || 'https://picsum.photos/800/500',
              caption: post.title || 'Blog Post',
              alt: post.excerpt || post.title || 'Blog post image',
            })),
            title: props.title || 'Latest Articles',
          },
        };
      }

      case 'blogCategories':
        // Convert to a simple divider or skip
        return {
          type: 'divider',
          props: {
            style: 'solid',
            spacing: 40,
          },
        };

      // About/content blocks -> use imageText block
      case 'about':
      case 'content': {
        return {
          type: 'imageText',
          props: {
            image: props.image || 'https://picsum.photos/600/400',
            title: props.title || 'About Us',
            description: props.content || props.subtitle || 'Learn more about our mission and values.',
            buttonText: 'Learn More',
            buttonUrl: '#',
            imagePosition: props.imagePosition || 'left',
            style: 'rounded',
          },
        };
      }

      // Team grid -> use features block with team members
      case 'teamGrid': {
        const members = props.members || [];
        return {
          type: 'features',
          props: {
            title: props.title || 'Our Team',
            subtitle: props.subtitle || 'Meet the people behind our success',
            columns: Math.min(members.length, 4) || 3,
            features: members.slice(0, 4).map((member: any) => ({
              icon: '👤',
              title: member.name || 'Team Member',
              description: `${member.role || 'Team Member'}${member.bio ? ' - ' + member.bio : ''}`,
            })),
          },
        };
      }

      // Contact form -> use newsletter block (simpler form)
      case 'contactForm': {
        return {
          type: 'newsletter',
          props: {
            title: props.title || 'Get in Touch',
            description: props.subtitle || 'Send us a message and we\'ll get back to you.',
            buttonText: props.submitText || 'Send Message',
            placeholder: 'Enter your email',
            style: 'stacked',
          },
        };
      }

      // Contact info -> use features block
      case 'contactInfo': {
        const features = [];
        if (props.email) {
          features.push({ icon: '📧', title: 'Email', description: props.email });
        }
        if (props.phone) {
          features.push({ icon: '📞', title: 'Phone', description: props.phone });
        }
        if (props.address) {
          features.push({ icon: '📍', title: 'Address', description: props.address });
        }
        if (props.social && Array.isArray(props.social)) {
          features.push({
            icon: '🌐',
            title: 'Social',
            description: props.social.map((s: any) => s.label || s.platform).join(' • '),
          });
        }
        return {
          type: 'features',
          props: {
            title: props.title || 'Contact Information',
            columns: Math.min(features.length, 4) || 2,
            features:
              features.length > 0
                ? features
                : [
                    { icon: '📧', title: 'Email', description: 'hello@example.com' },
                    { icon: '📍', title: 'Location', description: 'New York, NY' },
                  ],
          },
        };
      }

      // Course grid -> use features or pricing block
      case 'courseGrid': {
        const courses = props.courses || [];
        return {
          type: 'pricing',
          props: {
            plans: courses.slice(0, 3).map((course: any) => ({
              name: course.title || 'Course',
              price: course.price || '$99',
              period: '',
              features: [
                course.duration || '10+ hours',
                course.instructor ? `By ${course.instructor}` : 'Expert Instructor',
                `${course.students || '1000+'} students`,
                `${course.rating || 4.5}★ rating`,
              ],
              highlighted: false,
              buttonText: 'Enroll Now',
            })),
          },
        };
      }

      // Shop filters -> skip (not renderable as standalone)
      case 'shopFilters':
        return {
          type: 'divider',
          props: {
            style: 'gradient',
            spacing: 20,
          },
        };

      // Footer -> skip (handled separately by theme system)
      case 'footer':
        return {
          type: 'divider',
          props: {
            style: 'solid',
            spacing: 60,
          },
        };

      // Default: return as-is if it's a supported type
      default:
        return { type, props };
    }
  }

  /**
   * Convert a preset to the GeneratedThemeData format
   */
  private convertPresetToThemeData(
    preset: AiThemePreset,
    dto: GenerateAiThemeDto,
  ): GeneratedThemeData {
    // Apply any user customizations to the preset colors
    const colors = { ...preset.colors };
    if (dto.primaryColor) colors.primary = dto.primaryColor;
    if (dto.secondaryColor) colors.secondary = dto.secondaryColor;

    // Apply color scheme overrides if different from preset
    if (dto.colorScheme && dto.colorScheme !== preset.colorScheme) {
      if (dto.colorScheme === 'dark') {
        colors.background = '#0f172a';
        colors.surface = '#1e293b';
        colors.text = '#e2e8f0';
        colors.textMuted = '#94a3b8';
        colors.heading = '#f8fafc';
        colors.border = '#334155';
      } else if (dto.colorScheme === 'light') {
        colors.background = '#ffffff';
        colors.surface = '#f8fafc';
        colors.text = '#334155';
        colors.textMuted = '#64748b';
        colors.heading = '#0f172a';
        colors.border = '#e2e8f0';
      }
    }

    const settings: CustomThemeSettings = {
      colors,
      typography: {
        ...preset.typography,
        headingFont: dto.fontFamily || preset.typography.headingFont,
        bodyFont: dto.fontFamily || preset.typography.bodyFont,
      },
      layout: {
        sidebarPosition: preset.layout.sidebarPosition,
        contentWidth: preset.layout.contentWidth,
        headerStyle: preset.layout.headerStyle,
        footerStyle: preset.layout.footerStyle,
      },
      spacing: preset.spacing,
      borders: preset.borders,
    };

    // Convert preset pages to ThemePageData format
    // Map unsupported block types to supported equivalents
    const numberOfPages = dto.numberOfPages || preset.pages.length;
    const pages: ThemePageData[] = preset.pages.slice(0, numberOfPages).map((page) => ({
      id: uuid(),
      name: page.name,
      slug: page.slug,
      isHomePage: page.isHomePage,
      blocks: page.blocks.map((block) => {
        const mappedBlock = this.mapBlockToSupportedType(block);
        return {
          id: uuid(),
          type: mappedBlock.type as ContentBlockType,
          props: { ...mappedBlock.props },
        };
      }),
    }));

    return {
      settings,
      pages,
      name: dto.themeName || preset.name,
      description: dto.description || preset.description,
      features: Object.entries(preset.features)
        .filter(([_, v]) => v)
        .map(([k]) => k),
      generatedBy: 'preset',
      presetId: preset.id,
      presetName: preset.name,
    };
  }

  private async generateWithOpenAI(dto: GenerateAiThemeDto): Promise<GeneratedThemeData> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: this.getComprehensiveSystemPrompt() },
          { role: 'user', content: this.buildDetailedUserPrompt(dto) },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return this.parseComprehensiveAiResponse(content, dto);
  }

  private async generateWithAnthropic(dto: GenerateAiThemeDto): Promise<GeneratedThemeData> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4096,
        system: this.getComprehensiveSystemPrompt(),
        messages: [{ role: 'user', content: this.buildDetailedUserPrompt(dto) }],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    return this.parseComprehensiveAiResponse(content, dto);
  }

  /**
   * Professional image library with Unsplash URLs organized by category
   */
  private readonly UNSPLASH_IMAGES = {
    hero: {
      business:
        'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop',
      technology:
        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1920&h=1080&fit=crop',
      creative: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=1920&h=1080&fit=crop',
      ecommerce: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1920&h=1080&fit=crop',
      education:
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&h=1080&fit=crop',
      healthcare:
        'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1920&h=1080&fit=crop',
      restaurant:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&h=1080&fit=crop',
      fitness:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1920&h=1080&fit=crop',
      travel: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&h=1080&fit=crop',
      realestate:
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&h=1080&fit=crop',
      cyberpunk:
        'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1920&h=1080&fit=crop',
      gaming: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&h=1080&fit=crop',
    },
    team: [
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    ],
    testimonials: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=100&h=100&fit=crop',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    ],
    products: [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&h=600&fit=crop',
    ],
    gallery: [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=600&fit=crop',
    ],
    blog: [
      'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=500&fit=crop',
      'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800&h=500&fit=crop',
    ],
    about: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=800&fit=crop',
    office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=800&fit=crop',
    logos: [
      'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
      'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
      'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg',
    ],
  };

  /**
   * Professional content library with industry-specific content
   */
  private readonly CONTENT_LIBRARY = {
    testimonials: [
      {
        quote:
          'This solution transformed our business operations completely. We saw a 40% increase in productivity within the first month. The team was incredibly supportive throughout the implementation process.',
        author: 'Sarah Mitchell',
        role: 'Chief Operations Officer',
        company: 'TechVentures Inc.',
      },
      {
        quote:
          'Outstanding quality and exceptional customer service. The attention to detail and commitment to excellence is evident in everything they do. Highly recommend to any growing business.',
        author: 'Michael Chen',
        role: 'Founder & CEO',
        company: 'InnovateLabs',
      },
      {
        quote:
          'Working with this team has been an absolute pleasure. They understood our vision from day one and delivered beyond our expectations. Our revenue grew by 60% after implementing their solutions.',
        author: 'Emily Rodriguez',
        role: 'Marketing Director',
        company: 'GrowthFirst Agency',
      },
      {
        quote:
          'The best investment we made this year. The ROI was visible within weeks, not months. Their expertise in the industry is unmatched and their support team is always available when needed.',
        author: 'David Thompson',
        role: 'VP of Operations',
        company: 'Stellar Solutions',
      },
    ],
    features: {
      general: [
        {
          icon: '🚀',
          title: 'Lightning Fast Performance',
          description:
            'Experience blazing-fast load times with our optimized infrastructure. Every millisecond counts, and we ensure your visitors never wait.',
        },
        {
          icon: '🔒',
          title: 'Enterprise-Grade Security',
          description:
            'Your data is protected with bank-level encryption and continuous monitoring. We take security seriously so you can focus on growth.',
        },
        {
          icon: '📱',
          title: 'Fully Responsive Design',
          description:
            'Look stunning on every device. From smartphones to 4K displays, your content adapts seamlessly to any screen size.',
        },
        {
          icon: '🎯',
          title: 'Conversion Optimized',
          description:
            'Every element is designed with conversion in mind. Strategic placement and compelling calls-to-action drive results.',
        },
        {
          icon: '🌐',
          title: 'Global CDN Delivery',
          description:
            'Reach audiences worldwide with our distributed content network. Fast loading speeds no matter where your visitors are located.',
        },
        {
          icon: '📊',
          title: 'Advanced Analytics',
          description:
            'Make data-driven decisions with comprehensive insights. Track performance, understand user behavior, and optimize continuously.',
        },
      ],
      ecommerce: [
        {
          icon: '🛒',
          title: 'Smart Shopping Cart',
          description:
            'Intelligent cart that remembers preferences, suggests products, and streamlines checkout for maximum conversions.',
        },
        {
          icon: '💳',
          title: 'Secure Payments',
          description:
            'Accept all major credit cards, digital wallets, and buy-now-pay-later options with PCI-compliant processing.',
        },
        {
          icon: '📦',
          title: 'Order Management',
          description:
            'Track orders from placement to delivery with real-time updates and automated customer notifications.',
        },
        {
          icon: '🔄',
          title: 'Easy Returns',
          description:
            'Hassle-free return process that builds customer trust and encourages repeat purchases.',
        },
      ],
      education: [
        {
          icon: '📚',
          title: 'Interactive Learning',
          description:
            'Engage students with multimedia lessons, quizzes, and hands-on exercises that make learning stick.',
        },
        {
          icon: '🎓',
          title: 'Certifications',
          description:
            'Validate achievements with professional certificates that students can share on LinkedIn and resumes.',
        },
        {
          icon: '👥',
          title: 'Community Learning',
          description:
            'Connect with peers, join study groups, and learn from instructors in our vibrant learning community.',
        },
        {
          icon: '📈',
          title: 'Progress Tracking',
          description:
            'Visual dashboards show learning progress, completed modules, and areas for improvement.',
        },
      ],
      technology: [
        {
          icon: '🤖',
          title: 'Artificial Intelligence',
          description:
            'Cutting-edge AI and machine learning insights. From neural networks to AGI, we cover the future of intelligence.',
        },
        {
          icon: '🔐',
          title: 'Cybersecurity',
          description:
            'Threat analysis, defense strategies, and security best practices for the digital age.',
        },
        {
          icon: '⛓️',
          title: 'Blockchain & Web3',
          description:
            'DeFi, smart contracts, and decentralized systems. The future of digital ownership.',
        },
        {
          icon: '🚀',
          title: 'Emerging Tech',
          description:
            'Quantum computing, AR/VR, neural interfaces, and innovations shaping tomorrow.',
        },
      ],
      cyberpunk: [
        {
          icon: '⚡',
          title: 'Real-time Everything',
          description:
            'Live updates, instant notifications, and real-time collaboration powered by WebSockets.',
        },
        {
          icon: '🔒',
          title: 'Secure Payments',
          description:
            'Stripe, crypto, and custom payment gateways. PCI-compliant and quantum-safe encryption.',
        },
        {
          icon: '🧩',
          title: 'Modular Architecture',
          description:
            'Headless CMS, API-first design. Build anything you can imagine in the digital frontier.',
        },
        {
          icon: '🎨',
          title: 'Neon Aesthetics',
          description:
            'Glassmorphism, holographic UI, and cyberpunk-styled components for the future.',
        },
      ],
    },
    pricingPlans: [
      {
        name: 'Starter',
        price: '$29',
        period: '/month',
        features: [
          'Up to 5 team members',
          '10GB storage',
          'Email support',
          'Basic analytics',
          'API access',
        ],
        ctaText: 'Start Free Trial',
        ctaUrl: '/signup?plan=starter',
        featured: false,
      },
      {
        name: 'Professional',
        price: '$79',
        period: '/month',
        features: [
          'Up to 25 team members',
          '100GB storage',
          'Priority support',
          'Advanced analytics',
          'API access',
          'Custom integrations',
          'White-label options',
        ],
        ctaText: 'Get Started',
        ctaUrl: '/signup?plan=pro',
        featured: true,
      },
      {
        name: 'Enterprise',
        price: '$199',
        period: '/month',
        features: [
          'Unlimited team members',
          'Unlimited storage',
          '24/7 dedicated support',
          'Custom analytics',
          'Full API access',
          'Custom integrations',
          'White-label',
          'SLA guarantee',
          'Dedicated account manager',
        ],
        ctaText: 'Contact Sales',
        ctaUrl: '/contact?plan=enterprise',
        featured: false,
      },
    ],
    team: [
      {
        name: 'Alexandra Rivers',
        role: 'Chief Executive Officer',
        bio: 'With 15+ years of industry experience, Alexandra leads our vision for innovation and growth. Previously VP at Fortune 500 companies.',
        social: {
          twitter: 'https://twitter.com/alexrivers',
          linkedin: 'https://linkedin.com/in/alexrivers',
          email: 'alex@company.com',
        },
      },
      {
        name: 'Marcus Chen',
        role: 'Chief Technology Officer',
        bio: 'Former Google engineer with expertise in scalable systems. Marcus architects our technology to handle millions of users seamlessly.',
        social: {
          twitter: 'https://twitter.com/marcuschen',
          linkedin: 'https://linkedin.com/in/marcuschen',
          email: 'marcus@company.com',
        },
      },
      {
        name: 'Sophia Williams',
        role: 'Head of Design',
        bio: 'Award-winning designer who has shaped products used by millions. Sophia ensures every pixel serves a purpose.',
        social: { linkedin: 'https://linkedin.com/in/sophiawilliams', email: 'sophia@company.com' },
      },
      {
        name: 'James Rodriguez',
        role: 'VP of Marketing',
        bio: 'Growth expert who has scaled multiple startups from zero to IPO. James leads our global marketing strategy.',
        social: {
          twitter: 'https://twitter.com/jamesrodriguez',
          linkedin: 'https://linkedin.com/in/jamesrodriguez',
        },
      },
    ],
    faq: [
      {
        title: 'How do I get started?',
        content:
          'Getting started is easy! Simply sign up for a free trial, no credit card required. Our onboarding wizard will guide you through the setup process in under 5 minutes.',
      },
      {
        title: 'Can I cancel my subscription anytime?',
        content:
          'Absolutely! There are no long-term contracts or commitments. You can upgrade, downgrade, or cancel your subscription at any time from your account settings.',
      },
      {
        title: 'Do you offer custom enterprise solutions?',
        content:
          'Yes! Our enterprise plans are fully customizable to meet your specific needs. Contact our sales team to discuss your requirements and get a tailored solution.',
      },
      {
        title: 'What payment methods do you accept?',
        content:
          'We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans. Enterprise customers can also pay via invoice.',
      },
      {
        title: 'Is my data secure?',
        content:
          'Security is our top priority. We use AES-256 encryption, SOC 2 Type II compliance, and regular security audits. Your data is backed up daily and stored in geographically distributed data centers.',
      },
      {
        title: 'Do you offer refunds?',
        content:
          'Yes, we offer a 30-day money-back guarantee. If you are not completely satisfied, contact support within 30 days for a full refund, no questions asked.',
      },
    ],
    blogPosts: [
      {
        title: '10 Strategies to Accelerate Your Business Growth in 2024',
        excerpt:
          'Discover proven tactics that leading companies are using to scale rapidly. From customer retention to market expansion, learn what works.',
        author: 'Alexandra Rivers',
        date: 'January 15, 2024',
      },
      {
        title: 'The Future of Digital Transformation: Trends to Watch',
        excerpt:
          'AI, automation, and cloud-native technologies are reshaping industries. Here is what you need to know to stay ahead of the curve.',
        author: 'Marcus Chen',
        date: 'January 10, 2024',
      },
      {
        title: 'Building a Customer-Centric Culture: A Complete Guide',
        excerpt:
          'Learn how top brands create experiences that turn customers into loyal advocates. Practical tips you can implement today.',
        author: 'Sophia Williams',
        date: 'January 5, 2024',
      },
    ],
    products: [
      {
        name: 'Premium Wireless Headphones',
        price: '$299.99',
        originalPrice: '$399.99',
        description:
          'Experience crystal-clear audio with active noise cancellation and 40-hour battery life. Perfect for work and travel.',
        rating: 4.9,
      },
      {
        name: 'Smart Fitness Watch Pro',
        price: '$249.99',
        description:
          'Track your health with precision. Heart rate monitoring, GPS, sleep tracking, and 100+ workout modes.',
        rating: 4.8,
      },
      {
        name: 'Ergonomic Office Chair',
        price: '$549.99',
        description:
          'Designed for all-day comfort. Lumbar support, adjustable armrests, and breathable mesh back.',
        rating: 4.7,
      },
      {
        name: 'Portable Power Station',
        price: '$399.99',
        description:
          '1000Wh capacity powers your devices anywhere. Solar compatible for off-grid adventures.',
        rating: 4.9,
      },
    ],
    courses: [
      {
        title: 'Complete Web Development Bootcamp',
        instructor: 'Dr. Marcus Chen',
        price: '$94.99',
        rating: 4.9,
        duration: '52 hours',
        students: '125,000+',
        description:
          'Learn HTML, CSS, JavaScript, React, Node.js, and more. Build 20+ real-world projects.',
      },
      {
        title: 'Data Science & Machine Learning A-Z',
        instructor: 'Prof. Sarah Mitchell',
        price: '$84.99',
        rating: 4.8,
        duration: '44 hours',
        students: '98,000+',
        description:
          'Master Python, statistics, machine learning, and deep learning with hands-on projects.',
      },
      {
        title: 'Digital Marketing Masterclass',
        instructor: 'James Rodriguez',
        price: '$79.99',
        rating: 4.7,
        duration: '38 hours',
        students: '76,000+',
        description:
          'SEO, social media, email marketing, and paid ads. Complete digital marketing toolkit.',
      },
    ],
  };

  /**
   * Comprehensive system prompt for professional theme generation
   */
  private getComprehensiveSystemPrompt(): string {
    return `You are an expert web designer creating PROFESSIONAL, MARKETPLACE-READY website themes. Generate COMPLETE theme configurations with FULLY POPULATED content blocks - NO placeholders, NO Lorem ipsum, NO empty fields.

## CRITICAL REQUIREMENTS

1. ALL blocks must have COMPLETE props with realistic content
2. ALL images must use real Unsplash URLs (format: https://images.unsplash.com/photo-ID?w=WIDTH&h=HEIGHT&fit=crop)
3. ALL text content must be professional, industry-appropriate, and engaging
4. ALL buttons must have proper text and URLs (use relative paths like /contact, /signup, /shop)
5. Include proper SEO metadata for each page
6. Generate at least 3-4 blocks per page

## UNSPLASH IMAGE GUIDELINES

Use these Unsplash photo IDs for different categories (format: https://images.unsplash.com/photo-{ID}?w=WIDTH&h=HEIGHT&fit=crop):

Hero backgrounds (1920x1080): 1497366216548-37526070297c, 1518770660439-4636190af475, 1556742049-0cfed4f6a45d
Team photos (400x400): 1560250097-0b93528c311a, 1573496359142-b8d87734a5a2, 1472099645785-5658abf4ff4e, 1580489944761-15a19d654956
Testimonial avatars (100x100): 1494790108377-be9c29b29330, 1507003211169-0a1dd7228f2d, 1573497019940-1c28c88b4f3e
Products (600x600): 1523275335684-37898b6baf30, 1505740420928-5e560c06d30e, 1572635196237-14b3f281503f
Blog (800x500): 1499750310107-5fef28a66643, 1486312338219-ce68d2c6f44d, 1504868584819-f8e8b4b6d7e3

## BLOCK TYPES WITH COMPLETE PROPS

### hero
{
  "type": "hero",
  "props": {
    "title": "Compelling Headline Here",
    "subtitle": "Engaging subheadline that explains the value proposition",
    "backgroundImage": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop",
    "ctaText": "Get Started Free",
    "ctaUrl": "/signup",
    "secondaryCtaText": "Learn More",
    "secondaryCtaUrl": "/about",
    "alignment": "center",
    "overlayOpacity": 0.5,
    "overlayColor": "#000000"
  }
}

### features
{
  "type": "features",
  "props": {
    "title": "Why Choose Us",
    "subtitle": "Everything you need to succeed",
    "columns": 3,
    "features": [
      { "icon": "🚀", "title": "Lightning Fast", "description": "Experience blazing-fast load times with our optimized infrastructure.", "link": "/features/speed" },
      { "icon": "🔒", "title": "Secure by Design", "description": "Bank-level encryption protects your data 24/7.", "link": "/features/security" },
      { "icon": "📱", "title": "Mobile First", "description": "Look stunning on every device, from phones to desktops.", "link": "/features/responsive" }
    ]
  }
}

### testimonials
{
  "type": "testimonials",
  "props": {
    "title": "Trusted by Industry Leaders",
    "subtitle": "See what our customers are saying",
    "layout": "grid",
    "testimonials": [
      { "quote": "This solution transformed our business operations completely. We saw a 40% increase in productivity.", "author": "Sarah Mitchell", "role": "COO", "company": "TechVentures Inc", "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop", "rating": 5 },
      { "quote": "Outstanding quality and exceptional customer service. Highly recommend!", "author": "Michael Chen", "role": "CEO", "company": "InnovateLabs", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop", "rating": 5 }
    ]
  }
}

### pricing
{
  "type": "pricing",
  "props": {
    "title": "Simple, Transparent Pricing",
    "subtitle": "No hidden fees. Cancel anytime.",
    "plans": [
      { "name": "Starter", "price": "$29", "period": "/month", "description": "Perfect for individuals", "features": ["5 team members", "10GB storage", "Email support", "Basic analytics"], "ctaText": "Start Free Trial", "ctaUrl": "/signup?plan=starter", "featured": false },
      { "name": "Professional", "price": "$79", "period": "/month", "description": "For growing teams", "features": ["25 team members", "100GB storage", "Priority support", "Advanced analytics", "API access"], "ctaText": "Get Started", "ctaUrl": "/signup?plan=pro", "featured": true },
      { "name": "Enterprise", "price": "Custom", "period": "", "description": "For large organizations", "features": ["Unlimited members", "Unlimited storage", "24/7 support", "Custom integrations", "SLA guarantee"], "ctaText": "Contact Sales", "ctaUrl": "/contact", "featured": false }
    ]
  }
}

### teamGrid
{
  "type": "teamGrid",
  "props": {
    "title": "Meet Our Leadership Team",
    "subtitle": "Experts dedicated to your success",
    "members": [
      { "name": "Alexandra Rivers", "role": "CEO & Founder", "image": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop", "bio": "15+ years leading innovation in tech", "social": { "twitter": "https://twitter.com/alexrivers", "linkedin": "https://linkedin.com/in/alexrivers" } }
    ]
  }
}

### productGrid
{
  "type": "productGrid",
  "props": {
    "title": "Featured Products",
    "subtitle": "Discover our bestsellers",
    "columns": 4,
    "products": [
      { "name": "Premium Wireless Headphones", "price": "$299.99", "originalPrice": "$399.99", "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop", "description": "Crystal-clear audio with noise cancellation", "rating": 4.9, "url": "/products/headphones", "badge": "Sale" }
    ]
  }
}

### newsletter
{
  "type": "newsletter",
  "props": {
    "title": "Stay Updated",
    "subtitle": "Get the latest news and exclusive offers delivered to your inbox",
    "placeholder": "Enter your email address",
    "buttonText": "Subscribe Now",
    "successMessage": "Thanks for subscribing! Check your inbox for a confirmation email.",
    "privacyText": "We respect your privacy. Unsubscribe at any time.",
    "backgroundColor": "#f8fafc"
  }
}

### contactForm
{
  "type": "contactForm",
  "props": {
    "title": "Get in Touch",
    "subtitle": "We would love to hear from you. Send us a message!",
    "fields": [
      { "type": "text", "name": "name", "label": "Full Name", "placeholder": "John Smith", "required": true },
      { "type": "email", "name": "email", "label": "Email Address", "placeholder": "john@example.com", "required": true },
      { "type": "tel", "name": "phone", "label": "Phone Number", "placeholder": "+1 (555) 000-0000", "required": false },
      { "type": "select", "name": "subject", "label": "Subject", "options": ["General Inquiry", "Sales", "Support", "Partnership"], "required": true },
      { "type": "textarea", "name": "message", "label": "Message", "placeholder": "Tell us about your project...", "required": true, "rows": 5 }
    ],
    "submitText": "Send Message",
    "successMessage": "Thank you! We will respond within 24 hours."
  }
}

### blogPosts
{
  "type": "blogPosts",
  "props": {
    "title": "Latest Insights",
    "subtitle": "Expert advice and industry news",
    "columns": 3,
    "showExcerpt": true,
    "posts": [
      { "title": "10 Strategies for Business Growth", "excerpt": "Discover proven tactics that leading companies use to scale.", "image": "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&h=500&fit=crop", "date": "January 15, 2024", "author": "Alexandra Rivers", "url": "/blog/business-growth", "category": "Business" }
    ]
  }
}

### cta
{
  "type": "cta",
  "props": {
    "title": "Ready to Transform Your Business?",
    "subtitle": "Join 10,000+ companies already growing with us",
    "ctaText": "Start Your Free Trial",
    "ctaUrl": "/signup",
    "secondaryCtaText": "Schedule a Demo",
    "secondaryCtaUrl": "/demo",
    "style": "gradient",
    "backgroundColor": "#3b82f6",
    "backgroundImage": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=600&fit=crop"
  }
}

### stats
{
  "type": "stats",
  "props": {
    "title": "Trusted Worldwide",
    "stats": [
      { "value": "10K+", "label": "Active Users", "icon": "👥" },
      { "value": "99.9%", "label": "Uptime", "icon": "⚡" },
      { "value": "150+", "label": "Countries", "icon": "🌍" },
      { "value": "24/7", "label": "Support", "icon": "💬" }
    ],
    "columns": 4
  }
}

### accordion (FAQ)
{
  "type": "accordion",
  "props": {
    "title": "Frequently Asked Questions",
    "items": [
      { "title": "How do I get started?", "content": "Getting started is easy! Sign up for a free trial - no credit card required. Our onboarding wizard guides you through setup in under 5 minutes." },
      { "title": "Can I cancel anytime?", "content": "Absolutely! No long-term contracts. Upgrade, downgrade, or cancel anytime from your account settings." }
    ],
    "allowMultiple": true
  }
}

### gallery
{
  "type": "gallery",
  "props": {
    "title": "Our Work",
    "subtitle": "A showcase of our recent projects",
    "columns": 3,
    "lightbox": true,
    "images": [
      { "src": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop", "alt": "Mountain landscape project", "caption": "Brand Identity - TechCorp" },
      { "src": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop", "alt": "Nature photography project", "caption": "Website Design - EcoLife" }
    ]
  }
}

### video
{
  "type": "video",
  "props": {
    "title": "See How It Works",
    "subtitle": "Watch our 2-minute overview",
    "videoUrl": "https://www.youtube.com/embed/dQw4w9WgXcQ",
    "thumbnail": "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1280&h=720&fit=crop",
    "autoplay": false
  }
}

### logoCloud
{
  "type": "logoCloud",
  "props": {
    "title": "Trusted by Leading Brands",
    "logos": [
      { "name": "TechCorp", "src": "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=80&fit=crop", "alt": "TechCorp logo", "url": "https://example.com" }
    ]
  }
}

### socialProof
{
  "type": "socialProof",
  "props": {
    "title": "Join Our Growing Community",
    "stats": [
      { "value": "50K+", "label": "Twitter Followers" },
      { "value": "25K+", "label": "LinkedIn Followers" },
      { "value": "100K+", "label": "Newsletter Subscribers" }
    ],
    "socialLinks": [
      { "platform": "twitter", "url": "https://twitter.com/company", "icon": "twitter" },
      { "platform": "linkedin", "url": "https://linkedin.com/company/company", "icon": "linkedin" },
      { "platform": "facebook", "url": "https://facebook.com/company", "icon": "facebook" },
      { "platform": "instagram", "url": "https://instagram.com/company", "icon": "instagram" }
    ]
  }
}

## OUTPUT FORMAT

Return ONLY valid JSON:
{
  "settings": {
    "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "surface": "#hex", "text": "#hex", "textMuted": "#hex", "heading": "#hex", "link": "#hex", "linkHover": "#hex", "border": "#hex", "success": "#22c55e", "warning": "#f59e0b", "error": "#ef4444" },
    "typography": { "headingFont": "Inter", "bodyFont": "Inter", "baseFontSize": 16, "lineHeight": 1.6, "headingWeight": 700, "headingLineHeight": 1.2 },
    "layout": { "sidebarPosition": "none", "contentWidth": 1200, "headerStyle": "sticky", "footerStyle": "multicolumn", "containerMaxWidth": 1400 },
    "spacing": { "sectionPadding": 80, "elementSpacing": 24, "containerPadding": 32, "blockGap": 64 },
    "borders": { "radius": 12, "width": 1, "style": "solid" },
    "shadows": { "small": "0 1px 3px rgba(0,0,0,0.1)", "medium": "0 4px 6px rgba(0,0,0,0.1)", "large": "0 10px 25px rgba(0,0,0,0.1)" },
    "animations": { "enabled": true, "duration": 300, "easing": "ease-out" }
  },
  "pages": [
    {
      "id": "unique-uuid",
      "name": "Home",
      "slug": "home",
      "isHomePage": true,
      "seo": { "title": "Page Title | Brand", "description": "Meta description", "keywords": "keyword1, keyword2" },
      "blocks": [ ...complete blocks with all props... ]
    }
  ]
}

Generate COMPLETE, PROFESSIONAL content. Every block must be production-ready.`;
  }

  /**
   * Build detailed user prompt with all options
   */
  private buildDetailedUserPrompt(dto: GenerateAiThemeDto): string {
    const parts: string[] = [];

    parts.push(`Create a comprehensive theme with the following requirements:`);
    parts.push(`\n## Core Description\n${dto.prompt}`);

    if (dto.industry) {
      parts.push(`\n## Industry\n${dto.industry} - Generate industry-specific content and blocks`);
    }

    if (dto.style) {
      parts.push(`\n## Visual Style\n${dto.style}`);
    }

    if (dto.colorScheme) {
      parts.push(`\n## Color Scheme\n${dto.colorScheme}`);
    }

    if (dto.primaryColor) {
      parts.push(
        `\n## Primary Color\n${dto.primaryColor} - Use this as the base for the color palette`,
      );
    }

    if (dto.secondaryColor) {
      parts.push(`\n## Secondary Color\n${dto.secondaryColor}`);
    }

    if (dto.fontFamily) {
      parts.push(`\n## Font Family\n${dto.fontFamily}`);
    }

    const pageCount = dto.numberOfPages || 3;
    parts.push(`\n## Number of Pages\n${pageCount}`);

    if (dto.pageTypes && dto.pageTypes.length > 0) {
      parts.push(`\n## Required Page Types\n${dto.pageTypes.join(', ')}`);
    }

    if (dto.preferredBlocks && dto.preferredBlocks.length > 0) {
      parts.push(`\n## Preferred Content Blocks\n${dto.preferredBlocks.join(', ')}`);
    }

    if (dto.features) {
      const enabledFeatures = Object.entries(dto.features)
        .filter(([, v]) => v)
        .map(([k]) => k);
      if (enabledFeatures.length > 0) {
        parts.push(`\n## Required Features\n${enabledFeatures.join(', ')}`);
      }
    }

    if (dto.headerStyle) {
      parts.push(`\n## Header Style\n${dto.headerStyle}`);
    }

    if (dto.footerStyle) {
      parts.push(`\n## Footer Style\n${dto.footerStyle}`);
    }

    if (dto.includeEcommerce) {
      parts.push(`\n## E-commerce\nInclude product grids, shop pages, and checkout flow`);
    }

    if (dto.includeCourses) {
      parts.push(
        `\n## Courses/LMS\nInclude course grids, curriculum blocks, and learning features`,
      );
    }

    if (dto.includeBlog) {
      parts.push(`\n## Blog\nInclude blog grid, categories, and newsletter signup`);
    }

    if (dto.generateFullTheme) {
      parts.push(
        `\n## Full Theme Generation\nGenerate a complete, production-ready theme with all pages fully populated with realistic content`,
      );
    }

    parts.push(
      `\n\nGenerate a complete, professional theme configuration with realistic content appropriate for the industry and requirements.`,
    );

    return parts.join('\n');
  }

  /**
   * Parse comprehensive AI response
   */
  private parseComprehensiveAiResponse(
    content: string,
    dto: GenerateAiThemeDto,
  ): GeneratedThemeData {
    try {
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);
      const settings = this.validateAndEnhanceSettings(parsed.settings, dto);
      const pages = this.validateAndEnhancePages(parsed.pages || [], dto);

      const result: GeneratedThemeData = {
        settings,
        pages,
        name: dto.themeName || `AI Theme ${new Date().toLocaleDateString()}`,
        description: dto.description || `Generated with AI: ${dto.prompt.substring(0, 100)}...`,
        features: this.extractFeatures(dto),
        generatedBy: 'ai',
      };

      if (dto.generateFullTheme && parsed.themeJson) {
        result.themeJson = this.validateThemeJson(parsed.themeJson, dto);
      }

      return result;
    } catch (error) {
      console.error('AI response parse error:', error);
      throw new BadRequestException('Failed to parse AI response. Please try again.');
    }
  }

  /**
   * Validate and enhance theme settings with extended properties
   */
  private validateAndEnhanceSettings(settings: any, dto: GenerateAiThemeDto): CustomThemeSettings {
    const defaults: CustomThemeSettings = {
      colors: {
        primary: dto.primaryColor || '#3b82f6',
        secondary: dto.secondaryColor || '#1d4ed8',
        accent: '#8b5cf6',
        background: dto.colorScheme === 'dark' ? '#0f172a' : '#ffffff',
        surface: dto.colorScheme === 'dark' ? '#1e293b' : '#f8fafc',
        text: dto.colorScheme === 'dark' ? '#e2e8f0' : '#334155',
        textMuted: dto.colorScheme === 'dark' ? '#94a3b8' : '#64748b',
        heading: dto.colorScheme === 'dark' ? '#f8fafc' : '#0f172a',
        link: dto.primaryColor || '#3b82f6',
        linkHover: dto.secondaryColor || '#1d4ed8',
        border: dto.colorScheme === 'dark' ? '#334155' : '#e2e8f0',
      },
      typography: {
        headingFont: dto.fontFamily || 'Inter',
        bodyFont: dto.fontFamily || 'Inter',
        baseFontSize: 16,
        lineHeight: 1.6,
        headingWeight: 600,
      },
      layout: {
        sidebarPosition: 'none',
        contentWidth: 1200,
        headerStyle: this.mapHeaderStyle(dto.headerStyle),
        footerStyle: this.mapFooterStyle(dto.footerStyle),
      },
      spacing: {
        sectionPadding: 48,
        elementSpacing: 24,
        containerPadding: 32,
      },
      borders: {
        radius: dto.style === 'minimal' ? 4 : dto.style === 'bold' ? 16 : 8,
        width: 1,
      },
    };

    return this.deepMerge(defaults, settings || {});
  }

  /**
   * Validate and enhance pages with proper blocks
   */
  private validateAndEnhancePages(pages: any[], dto: GenerateAiThemeDto): ThemePageData[] {
    if (pages.length > 0) {
      return pages.map((page, index) => ({
        id: page.id || uuid(),
        name: page.name || (index === 0 ? 'Home' : `Page ${index + 1}`),
        slug: page.slug || (index === 0 ? 'home' : `page-${index + 1}`),
        isHomePage: page.isHomePage ?? index === 0,
        blocks: this.validateBlocks(page.blocks || []),
      }));
    }

    return this.generateIndustryPages(dto);
  }

  /**
   * Validate blocks and ensure proper structure
   */
  private validateBlocks(blocks: any[]): ContentBlockData[] {
    return blocks.map((block) => ({
      id: block.id || uuid(),
      type: block.type || 'textBlock',
      props: block.props || {},
    }));
  }

  /**
   * Generate industry-specific pages
   */
  private generateIndustryPages(dto: GenerateAiThemeDto): ThemePageData[] {
    const pageTypes = dto.pageTypes || this.getDefaultPageTypes(dto.industry);
    const pages: ThemePageData[] = [];

    pageTypes.slice(0, dto.numberOfPages || 3).forEach((pageType, index) => {
      pages.push({
        id: uuid(),
        name: this.getPageName(pageType),
        slug: pageType,
        isHomePage: index === 0,
        blocks: this.generateBlocksForPageType(pageType, dto),
      });
    });

    return pages;
  }

  /**
   * Get default page types for industry
   */
  private getDefaultPageTypes(industry?: IndustryType): PageType[] {
    const industryPages: Record<string, PageType[]> = {
      ecommerce: ['home', 'shop', 'products', 'about', 'contact'],
      education: ['home', 'courses', 'about', 'blog', 'contact'],
      saas: ['home', 'pricing', 'about', 'blog', 'contact'],
      portfolio: ['home', 'portfolio', 'about', 'contact'],
      blog: ['home', 'blog', 'about', 'contact'],
      restaurant: ['home', 'about', 'contact'],
      healthcare: ['home', 'services', 'team', 'about', 'contact'],
      finance: ['home', 'services', 'about', 'contact'],
      agency: ['home', 'services', 'portfolio', 'team', 'contact'],
      nonprofit: ['home', 'about', 'team', 'contact'],
      fitness: ['home', 'services', 'pricing', 'about', 'contact'],
      travel: ['home', 'services', 'about', 'blog', 'contact'],
      realestate: ['home', 'products', 'about', 'contact'],
      technology: ['home', 'services', 'about', 'blog', 'contact'],
      entertainment: ['home', 'about', 'blog', 'contact'],
      general: ['home', 'about', 'services', 'contact'],
    };

    return industryPages[industry || 'general'] || industryPages.general;
  }

  /**
   * Get human-readable page name
   */
  private getPageName(pageType: PageType): string {
    const names: Record<PageType, string> = {
      home: 'Home',
      about: 'About Us',
      services: 'Services',
      products: 'Products',
      blog: 'Blog',
      contact: 'Contact',
      pricing: 'Pricing',
      faq: 'FAQ',
      team: 'Our Team',
      portfolio: 'Portfolio',
      courses: 'Courses',
      shop: 'Shop',
      checkout: 'Checkout',
      login: 'Login',
      register: 'Register',
    };
    return names[pageType] || pageType;
  }

  /**
   * Generate blocks for specific page type
   */
  private generateBlocksForPageType(
    pageType: PageType,
    dto: GenerateAiThemeDto,
  ): ContentBlockData[] {
    const blocks: ContentBlockData[] = [];
    const preferredBlocks = dto.preferredBlocks || [];

    switch (pageType) {
      case 'home':
        blocks.push(this.createHeroBlock(dto));
        blocks.push(this.createFeaturesBlock(dto));
        if (dto.includeEcommerce) blocks.push(this.createProductGridBlock());
        if (dto.includeCourses) blocks.push(this.createCourseGridBlock());
        blocks.push(this.createTestimonialsBlock());
        blocks.push(this.createCtaBlock(dto));
        break;

      case 'about':
        blocks.push(this.createAboutBlock());
        blocks.push(this.createTeamGridBlock());
        blocks.push(this.createTimelineBlock());
        blocks.push(this.createStatsBlock());
        break;

      case 'services':
        blocks.push(this.createHeroBlock(dto, 'Our Services'));
        blocks.push(this.createFeatureCardsBlock());
        blocks.push(this.createPricingBlock());
        blocks.push(this.createCtaBlock(dto));
        break;

      case 'products':
      case 'shop':
        blocks.push(this.createHeroBlock(dto, 'Our Products'));
        blocks.push(this.createProductGridBlock());
        blocks.push(this.createTestimonialsBlock());
        break;

      case 'blog':
        blocks.push(this.createHeroBlock(dto, 'Blog'));
        blocks.push(this.createBlogGridBlock());
        blocks.push(this.createNewsletterBlock());
        break;

      case 'contact':
        blocks.push(this.createHeroBlock(dto, 'Contact Us'));
        blocks.push(this.createContactFormBlock());
        blocks.push(this.createContactInfoBlock());
        break;

      case 'pricing':
        blocks.push(this.createHeroBlock(dto, 'Pricing'));
        blocks.push(this.createPricingBlock());
        blocks.push(this.createAccordionBlock());
        blocks.push(this.createCtaBlock(dto));
        break;

      case 'faq':
        blocks.push(this.createHeroBlock(dto, 'FAQ'));
        blocks.push(this.createAccordionBlock());
        blocks.push(this.createContactInfoBlock());
        break;

      case 'team':
        blocks.push(this.createHeroBlock(dto, 'Our Team'));
        blocks.push(this.createTeamGridBlock());
        blocks.push(this.createAboutBlock());
        break;

      case 'portfolio':
        blocks.push(this.createHeroBlock(dto, 'Portfolio'));
        blocks.push(this.createGalleryBlock());
        blocks.push(this.createTestimonialsBlock());
        break;

      case 'courses':
        blocks.push(this.createHeroBlock(dto, 'Courses'));
        blocks.push(this.createCourseGridBlock());
        blocks.push(this.createTestimonialsBlock());
        break;

      default:
        blocks.push(this.createHeroBlock(dto));
        blocks.push(this.createFeaturesBlock(dto));
    }

    // Add any preferred blocks that weren't already included
    preferredBlocks.forEach((blockType) => {
      if (!blocks.some((b) => b.type === blockType)) {
        const block = this.createBlockByType(blockType, dto);
        if (block) blocks.push(block);
      }
    });

    return blocks;
  }

  // ============================================
  // PROFESSIONAL BLOCK CREATION METHODS
  // All blocks include complete props with real content
  // ============================================

  private getHeroImage(industry?: string): string {
    const images = this.UNSPLASH_IMAGES.hero;
    return images[industry as keyof typeof images] || images.business;
  }

  private createHeroBlock(dto: GenerateAiThemeDto, title?: string): ContentBlockData {
    const industryTitles: Record<string, { title: string; subtitle: string }> = {
      ecommerce: {
        title: 'Discover Premium Products',
        subtitle:
          'Shop the latest trends with exclusive deals and free shipping on orders over $50',
      },
      education: {
        title: 'Transform Your Future',
        subtitle: 'Learn from industry experts with courses designed to accelerate your career',
      },
      saas: {
        title: 'Powerful Tools for Modern Teams',
        subtitle: 'Streamline your workflow with intelligent automation and seamless integrations',
      },
      agency: {
        title: 'Creative Solutions That Drive Results',
        subtitle: 'Award-winning design and strategy for brands that want to stand out',
      },
      healthcare: {
        title: 'Your Health, Our Priority',
        subtitle: 'Compassionate care with cutting-edge technology for better health outcomes',
      },
      fitness: {
        title: 'Unlock Your Potential',
        subtitle:
          'Expert trainers, world-class facilities, and personalized programs for every goal',
      },
      restaurant: {
        title: 'Exceptional Dining Experience',
        subtitle: 'Fresh ingredients, inspired recipes, and an atmosphere you will love',
      },
      travel: {
        title: 'Discover Your Next Adventure',
        subtitle: 'Curated travel experiences that create memories lasting a lifetime',
      },
      realestate: {
        title: 'Find Your Dream Home',
        subtitle: 'Expert guidance through every step of your real estate journey',
      },
      portfolio: {
        title: 'Creative Work That Inspires',
        subtitle: 'Award-winning designs crafted with passion and precision',
      },
      blog: {
        title: 'Insights That Matter',
        subtitle: 'Thoughtful perspectives on the topics shaping our world',
      },
      technology: {
        title: 'Exploring the Digital Frontier',
        subtitle: 'Deep dives into AI, blockchain, cybersecurity, and emerging tech',
      },
      cyberpunk: {
        title: 'Welcome to the Neon District',
        subtitle: 'Build. Learn. Sell. Connect — In the Future',
      },
      gaming: {
        title: 'Level Up Your Experience',
        subtitle: 'Immersive gaming content, reviews, and community',
      },
      general: {
        title: 'Welcome to Excellence',
        subtitle: 'Innovative solutions designed to help you succeed',
      },
    };

    // Check if prompt contains cyberpunk-related keywords
    const promptLower = (dto.prompt || '').toLowerCase();
    const isCyberpunk =
      promptLower.includes('cyberpunk') ||
      promptLower.includes('neon') ||
      promptLower.includes('futuristic') ||
      promptLower.includes('sci-fi') ||
      promptLower.includes('dystopian');

    const effectiveIndustry = isCyberpunk ? 'cyberpunk' : dto.industry || 'general';
    const content = industryTitles[effectiveIndustry] || industryTitles.general;

    // Cyberpunk-specific CTA text
    const ctaText = isCyberpunk ? 'Explore Platform' : 'Get Started';
    const secondaryCtaText = isCyberpunk ? 'Join Now' : 'Learn More';

    return {
      id: uuid(),
      type: 'hero',
      props: {
        title: title || content.title,
        subtitle: dto.description || content.subtitle,
        backgroundImage: this.getHeroImage(effectiveIndustry),
        ctaText,
        ctaUrl: '/signup',
        secondaryCtaText,
        secondaryCtaUrl: '/about',
        alignment: 'center',
        overlayOpacity: isCyberpunk ? 0.7 : 0.5,
        overlayColor: isCyberpunk ? '#0A0A0F' : '#000000',
      },
    };
  }

  private createFeaturesBlock(dto: GenerateAiThemeDto): ContentBlockData {
    // Check if prompt contains cyberpunk-related keywords
    const promptLower = (dto.prompt || '').toLowerCase();
    const isCyberpunk =
      promptLower.includes('cyberpunk') ||
      promptLower.includes('neon') ||
      promptLower.includes('futuristic') ||
      promptLower.includes('sci-fi') ||
      promptLower.includes('dystopian');

    const effectiveIndustry = isCyberpunk ? 'cyberpunk' : dto.industry;

    const features =
      effectiveIndustry &&
      this.CONTENT_LIBRARY.features[effectiveIndustry as keyof typeof this.CONTENT_LIBRARY.features]
        ? this.CONTENT_LIBRARY.features[
            effectiveIndustry as keyof typeof this.CONTENT_LIBRARY.features
          ]
        : this.CONTENT_LIBRARY.features.general;

    // Cyberpunk-themed titles
    const title = isCyberpunk ? 'Platform Capabilities' : 'Why Choose Us';
    const subtitle = isCyberpunk
      ? 'Everything you need in one futuristic ecosystem'
      : 'Everything you need to succeed, all in one place';

    return {
      id: uuid(),
      type: 'features',
      props: {
        title,
        subtitle,
        columns: 3,
        features: features.slice(0, 6).map((f) => ({
          ...f,
          link: `/features/${f.title.toLowerCase().replace(/\s+/g, '-')}`,
        })),
      },
    };
  }

  private createTestimonialsBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'testimonials',
      props: {
        title: 'Trusted by Industry Leaders',
        subtitle: 'See what our customers are saying about us',
        layout: 'grid',
        testimonials: this.CONTENT_LIBRARY.testimonials.map((t, i) => ({
          ...t,
          avatar: this.UNSPLASH_IMAGES.testimonials[i % this.UNSPLASH_IMAGES.testimonials.length],
          rating: 5,
        })),
      },
    };
  }

  private createCtaBlock(dto: GenerateAiThemeDto): ContentBlockData {
    return {
      id: uuid(),
      type: 'cta',
      props: {
        title: 'Ready to Transform Your Business?',
        subtitle: 'Join 10,000+ companies already growing with us. Start your free trial today.',
        ctaText: 'Start Free Trial',
        ctaUrl: '/signup',
        secondaryCtaText: 'Schedule a Demo',
        secondaryCtaUrl: '/demo',
        style: 'gradient',
        backgroundColor: dto.primaryColor || '#3b82f6',
        backgroundImage: this.getHeroImage(dto.industry),
      },
    };
  }

  private createProductGridBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'productGrid',
      props: {
        title: 'Featured Products',
        subtitle: 'Discover our bestselling items',
        columns: 4,
        products: this.CONTENT_LIBRARY.products.map((p, i) => ({
          ...p,
          image: this.UNSPLASH_IMAGES.products[i % this.UNSPLASH_IMAGES.products.length],
          url: `/products/${p.name.toLowerCase().replace(/\s+/g, '-')}`,
          badge: i === 0 ? 'Bestseller' : i === 1 ? 'New' : undefined,
        })),
      },
    };
  }

  private createCourseGridBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'courseGrid',
      props: {
        title: 'Popular Courses',
        subtitle: 'Learn from world-class instructors',
        columns: 3,
        courses: this.CONTENT_LIBRARY.courses.map((c, i) => ({
          ...c,
          image: this.UNSPLASH_IMAGES.blog[i % this.UNSPLASH_IMAGES.blog.length],
          url: `/courses/${c.title.toLowerCase().replace(/\s+/g, '-')}`,
        })),
      },
    };
  }

  private createAboutBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'about',
      props: {
        title: 'Our Story',
        subtitle: 'Building the future, one innovation at a time',
        content: `Founded with a vision to transform how businesses operate, we have grown from a small startup to a global leader in our industry. Our journey has been defined by a relentless pursuit of excellence and an unwavering commitment to our customers.

Today, we serve thousands of businesses worldwide, helping them achieve their goals through innovative solutions and exceptional service. Our team of experts brings decades of combined experience, ensuring that every project we undertake exceeds expectations.

We believe in the power of technology to solve real problems and create meaningful impact. That is why we continue to invest in research and development, staying at the forefront of industry trends and emerging technologies.`,
        image: this.UNSPLASH_IMAGES.about,
        stats: [
          { value: '10+', label: 'Years of Excellence', icon: '📅' },
          { value: '500+', label: 'Happy Clients', icon: '😊' },
          { value: '1,000+', label: 'Projects Delivered', icon: '🚀' },
          { value: '50+', label: 'Team Members', icon: '👥' },
        ],
      },
    };
  }

  private createTeamGridBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'teamGrid',
      props: {
        title: 'Meet Our Leadership Team',
        subtitle: 'Experts dedicated to your success',
        members: this.CONTENT_LIBRARY.team.map((m, i) => ({
          ...m,
          image: this.UNSPLASH_IMAGES.team[i % this.UNSPLASH_IMAGES.team.length],
        })),
      },
    };
  }

  private createTimelineBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'timeline',
      props: {
        title: 'Our Journey',
        subtitle: 'Key milestones that shaped who we are today',
        events: [
          {
            date: '2018',
            title: 'Company Founded',
            description:
              'Started with a vision to revolutionize the industry. Three founders, one shared dream, and endless possibilities.',
          },
          {
            date: '2019',
            title: 'First Major Client',
            description:
              'Secured our first Fortune 500 client, validating our approach and opening doors to new opportunities.',
          },
          {
            date: '2020',
            title: 'Series A Funding',
            description:
              'Raised $10M in Series A funding to accelerate growth and expand our product offerings.',
          },
          {
            date: '2021',
            title: 'Global Expansion',
            description:
              'Opened offices in London, Singapore, and Sydney to better serve our international customers.',
          },
          {
            date: '2022',
            title: '100K Users Milestone',
            description:
              'Reached 100,000 active users, a testament to our team dedication and product excellence.',
          },
          {
            date: '2024',
            title: 'Industry Leadership',
            description:
              'Recognized as an industry leader with multiple awards and a growing ecosystem of partners.',
          },
        ],
      },
    };
  }

  private createStatsBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'stats',
      props: {
        title: 'Trusted Worldwide',
        subtitle: 'Numbers that speak for themselves',
        stats: [
          { value: '10K+', label: 'Active Users', icon: '👥' },
          { value: '99.9%', label: 'Uptime SLA', icon: '⚡' },
          { value: '150+', label: 'Countries Served', icon: '🌍' },
          { value: '24/7', label: 'Support Available', icon: '💬' },
        ],
        columns: 4,
        backgroundColor: '#f8fafc',
      },
    };
  }

  private createFeatureCardsBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'featureCards',
      props: {
        title: 'Our Services',
        subtitle: 'Comprehensive solutions tailored to your needs',
        cards: [
          {
            icon: '💼',
            title: 'Strategic Consulting',
            description:
              'Expert guidance to optimize your business operations and drive sustainable growth. We analyze, strategize, and implement solutions that work.',
            image: this.UNSPLASH_IMAGES.gallery[0],
          },
          {
            icon: '🎨',
            title: 'Creative Design',
            description:
              'Beautiful, user-centered designs that captivate your audience and strengthen your brand identity across all touchpoints.',
            image: this.UNSPLASH_IMAGES.gallery[1],
          },
          {
            icon: '⚙️',
            title: 'Custom Development',
            description:
              'Tailored software solutions built with cutting-edge technologies. From web apps to enterprise systems, we bring your vision to life.',
            image: this.UNSPLASH_IMAGES.gallery[2],
          },
          {
            icon: '📈',
            title: 'Growth Marketing',
            description:
              'Data-driven marketing strategies that attract, engage, and convert your ideal customers. Maximize ROI with proven tactics.',
            image: this.UNSPLASH_IMAGES.gallery[3],
          },
        ],
      },
    };
  }

  private createPricingBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'pricing',
      props: {
        title: 'Simple, Transparent Pricing',
        subtitle: 'No hidden fees. Cancel anytime. Start free.',
        plans: this.CONTENT_LIBRARY.pricingPlans,
        billingToggle: true,
        annualDiscount: 20,
      },
    };
  }

  private createBlogGridBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'blogPosts',
      props: {
        title: 'Latest Insights',
        subtitle: 'Expert advice and industry news to keep you ahead',
        columns: 3,
        showExcerpt: true,
        showAuthor: true,
        showDate: true,
        posts: this.CONTENT_LIBRARY.blogPosts.map((p, i) => ({
          ...p,
          image: this.UNSPLASH_IMAGES.blog[i % this.UNSPLASH_IMAGES.blog.length],
          url: `/blog/${p.title
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')}`,
          category: 'Industry Insights',
          readTime: `${5 + i * 2} min read`,
        })),
      },
    };
  }

  private createNewsletterBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'newsletter',
      props: {
        title: 'Stay Ahead of the Curve',
        subtitle:
          'Join 25,000+ subscribers getting exclusive insights, tips, and updates delivered straight to their inbox.',
        placeholder: 'Enter your email address',
        buttonText: 'Subscribe Now',
        successMessage:
          'Thanks for subscribing! Check your inbox for a welcome email with exclusive content.',
        privacyText: 'We respect your privacy. Unsubscribe at any time.',
        backgroundColor: '#f8fafc',
        features: [
          'Weekly industry insights',
          'Exclusive tips & tutorials',
          'Early access to new features',
        ],
      },
    };
  }

  private createContactFormBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'contactForm',
      props: {
        title: 'Get in Touch',
        subtitle: 'Have a question or want to work together? We would love to hear from you.',
        fields: [
          {
            type: 'text',
            name: 'firstName',
            label: 'First Name',
            placeholder: 'John',
            required: true,
            width: 'half',
          },
          {
            type: 'text',
            name: 'lastName',
            label: 'Last Name',
            placeholder: 'Smith',
            required: true,
            width: 'half',
          },
          {
            type: 'email',
            name: 'email',
            label: 'Email Address',
            placeholder: 'john@example.com',
            required: true,
          },
          {
            type: 'tel',
            name: 'phone',
            label: 'Phone Number',
            placeholder: '+1 (555) 000-0000',
            required: false,
          },
          {
            type: 'select',
            name: 'subject',
            label: 'Subject',
            options: ['General Inquiry', 'Sales', 'Support', 'Partnership', 'Other'],
            required: true,
          },
          {
            type: 'textarea',
            name: 'message',
            label: 'Message',
            placeholder: 'Tell us about your project or question...',
            required: true,
            rows: 5,
          },
        ],
        submitText: 'Send Message',
        successMessage: 'Thank you for reaching out! We typically respond within 24 hours.',
        showSocialLinks: true,
      },
    };
  }

  private createContactInfoBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'contactInfo',
      props: {
        title: 'Contact Information',
        subtitle: 'Reach out through any of these channels',
        email: 'hello@yourcompany.com',
        phone: '+1 (555) 123-4567',
        address: '123 Innovation Drive, Suite 400, San Francisco, CA 94102',
        hours: 'Monday - Friday: 9:00 AM - 6:00 PM PST',
        mapEmbed:
          'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0977869999!2d-122.4194!3d37.7749!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM3fCsDQ2JzI5LjYiTiAxMjLCsDI1JzA5LjkiVw!5e0!3m2!1sen!2sus!4v1234567890',
        social: [
          { platform: 'twitter', url: 'https://twitter.com/company', label: '@company' },
          { platform: 'linkedin', url: 'https://linkedin.com/company/company', label: 'LinkedIn' },
          { platform: 'facebook', url: 'https://facebook.com/company', label: 'Facebook' },
          { platform: 'instagram', url: 'https://instagram.com/company', label: '@company' },
        ],
      },
    };
  }

  private createAccordionBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'accordion',
      props: {
        title: 'Frequently Asked Questions',
        subtitle: 'Find answers to common questions about our services',
        allowMultiple: true,
        items: this.CONTENT_LIBRARY.faq,
      },
    };
  }

  private createGalleryBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'gallery',
      props: {
        title: 'Our Portfolio',
        subtitle: 'A showcase of our recent work and achievements',
        columns: 3,
        lightbox: true,
        filterCategories: ['All', 'Branding', 'Web Design', 'Photography', 'Marketing'],
        images: this.UNSPLASH_IMAGES.gallery.map((src, i) => ({
          src,
          alt: `Portfolio project ${i + 1}`,
          caption: [
            'Brand Identity - TechCorp',
            'Website Redesign - EcoLife',
            'Marketing Campaign - FreshStart',
            'Product Photography - StyleCo',
            'Digital Campaign - HealthPlus',
            'App Design - FinanceApp',
          ][i],
          category: [
            'Branding',
            'Web Design',
            'Marketing',
            'Photography',
            'Marketing',
            'Web Design',
          ][i],
        })),
      },
    };
  }

  private createVideoBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'video',
      props: {
        title: 'See How It Works',
        subtitle: 'Watch our 2-minute overview to learn how we can help you succeed',
        videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnail:
          'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=1280&h=720&fit=crop',
        autoplay: false,
        showControls: true,
      },
    };
  }

  private createLogoCloudBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'logoCloud',
      props: {
        title: 'Trusted by Industry Leaders',
        subtitle: 'Join thousands of companies using our platform',
        logos: [
          { name: 'TechCorp', alt: 'TechCorp logo', url: '#' },
          { name: 'InnovateLabs', alt: 'InnovateLabs logo', url: '#' },
          { name: 'GrowthFirst', alt: 'GrowthFirst logo', url: '#' },
          { name: 'FutureScale', alt: 'FutureScale logo', url: '#' },
          { name: 'DataDrive', alt: 'DataDrive logo', url: '#' },
        ],
      },
    };
  }

  private createSocialProofBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'socialProof',
      props: {
        title: 'Join Our Growing Community',
        stats: [
          { value: '50K+', label: 'Twitter Followers', icon: '🐦' },
          { value: '25K+', label: 'LinkedIn Connections', icon: '💼' },
          { value: '100K+', label: 'Newsletter Subscribers', icon: '📧' },
        ],
        socialLinks: [
          { platform: 'twitter', url: 'https://twitter.com/company', icon: 'twitter' },
          { platform: 'linkedin', url: 'https://linkedin.com/company/company', icon: 'linkedin' },
          { platform: 'facebook', url: 'https://facebook.com/company', icon: 'facebook' },
          { platform: 'instagram', url: 'https://instagram.com/company', icon: 'instagram' },
          { platform: 'youtube', url: 'https://youtube.com/company', icon: 'youtube' },
        ],
      },
    };
  }

  /**
   * Allowed block types for validation (prevents unvalidated dynamic method calls)
   */
  private static readonly ALLOWED_BLOCK_TYPES: ReadonlySet<string> = new Set([
    'hero', 'features', 'featureCards', 'testimonials', 'logoCloud', 'socialProof',
    'cta', 'newsletter', 'productGrid', 'courseGrid', 'pricing', 'teamGrid',
    'about', 'timeline', 'stats', 'blogPosts', 'gallery', 'video', 'accordion',
    'contactForm', 'contactInfo',
  ]);

  /**
   * Create block by type - comprehensive mapping for all block types
   * Uses explicit validation to prevent unvalidated dynamic method calls
   */
  private createBlockByType(
    blockType: ContentBlockType,
    dto: GenerateAiThemeDto,
  ): ContentBlockData | null {
    // Validate blockType against allowed list before proceeding
    const blockTypeStr = String(blockType);
    if (!AiThemeGeneratorService.ALLOWED_BLOCK_TYPES.has(blockTypeStr)) {
      return null;
    }

    // Now safe to use blockType as it's been validated
    switch (blockTypeStr) {
      case 'hero':
        return this.createHeroBlock(dto);
      case 'features':
        return this.createFeaturesBlock(dto);
      case 'featureCards':
        return this.createFeatureCardsBlock();
      case 'testimonials':
        return this.createTestimonialsBlock();
      case 'logoCloud':
        return this.createLogoCloudBlock();
      case 'socialProof':
        return this.createSocialProofBlock();
      case 'cta':
        return this.createCtaBlock(dto);
      case 'newsletter':
        return this.createNewsletterBlock();
      case 'productGrid':
        return this.createProductGridBlock();
      case 'courseGrid':
        return this.createCourseGridBlock();
      case 'pricing':
        return this.createPricingBlock();
      case 'teamGrid':
        return this.createTeamGridBlock();
      case 'about':
        return this.createAboutBlock();
      case 'timeline':
        return this.createTimelineBlock();
      case 'stats':
        return this.createStatsBlock();
      case 'blogPosts':
        return this.createBlogGridBlock();
      case 'gallery':
        return this.createGalleryBlock();
      case 'video':
        return this.createVideoBlock();
      case 'accordion':
        return this.createAccordionBlock();
      case 'contactForm':
        return this.createContactFormBlock();
      case 'contactInfo':
        return this.createContactInfoBlock();
      default:
        return null;
    }
  }

  /**
   * Extract features from DTO
   */
  private extractFeatures(dto: GenerateAiThemeDto): string[] {
    const features: string[] = [];

    if (dto.features?.darkMode) features.push('darkMode');
    if (dto.features?.animations) features.push('animations');
    if (dto.features?.responsiveImages) features.push('responsiveImages');
    if (dto.features?.lazyLoading) features.push('lazyLoading');
    if (dto.features?.stickyHeader) features.push('stickyHeader');
    if (dto.features?.backToTop) features.push('backToTop');
    if (dto.features?.socialSharing) features.push('socialSharing');
    if (dto.features?.searchBar) features.push('searchBar');
    if (dto.features?.newsletter) features.push('newsletter');
    if (dto.features?.chatWidget) features.push('chatWidget');
    if (dto.includeEcommerce) features.push('ecommerce');
    if (dto.includeCourses) features.push('courses');
    if (dto.includeBlog) features.push('blog');

    return features;
  }

  /**
   * Validate theme.json configuration
   */
  private validateThemeJson(themeJson: any, dto: GenerateAiThemeDto): ThemeJsonConfig {
    return {
      name: themeJson.name || dto.themeName || 'AI Generated Theme',
      version: themeJson.version || '1.0.0',
      author: themeJson.author || 'AI Theme Generator',
      description: themeJson.description || dto.description || '',
      license: themeJson.license || 'MIT',
      templates: themeJson.templates || [],
      settings: themeJson.settings || {},
      features: themeJson.features || this.extractFeatures(dto),
      supports: {
        widgets: true,
        menus: true,
        customHeader: true,
        customBackground: true,
        postThumbnails: true,
        responsiveEmbeds: true,
        darkMode: dto.features?.darkMode ?? false,
      },
    };
  }

  /**
   * Map header style from DTO to valid CustomThemeSettings value
   */
  private mapHeaderStyle(style?: string): 'default' | 'centered' | 'minimal' | 'sticky' {
    const validStyles: Record<string, 'default' | 'centered' | 'minimal' | 'sticky'> = {
      default: 'default',
      sticky: 'sticky',
      minimal: 'minimal',
      centered: 'centered',
      mega: 'default', // Map mega to default
    };
    return validStyles[style || 'default'] || 'default';
  }

  /**
   * Map footer style from DTO to valid CustomThemeSettings value
   */
  private mapFooterStyle(style?: string): 'default' | 'centered' | 'minimal' {
    const validStyles: Record<string, 'default' | 'centered' | 'minimal'> = {
      default: 'default',
      minimal: 'minimal',
      centered: 'centered',
      multicolumn: 'default', // Map multicolumn to default
    };
    return validStyles[style || 'default'] || 'default';
  }

  /**
   * Deep merge utility
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else if (source[key] !== undefined) {
        result[key] = source[key];
      }
    }
    return result;
  }

  /**
   * Generate complete theme.json configuration
   */
  generateThemeJson(themeData: GeneratedThemeData): ThemeJsonConfig {
    const { settings, pages, name, description, features } = themeData;

    const templateNames = pages.map((p) => {
      if (p.isHomePage) return 'home.hbs';
      return `page-${p.slug}.hbs`;
    });

    // Add standard templates
    const standardTemplates = [
      'header.hbs',
      'footer.hbs',
      'single-post.hbs',
      'single-page.hbs',
      'archive.hbs',
      'shop.hbs',
      'single-product.hbs',
      'courses.hbs',
      'single-course.hbs',
      'login.hbs',
      'register.hbs',
      'cart.hbs',
      'checkout.hbs',
    ];

    return {
      name,
      version: '1.0.0',
      author: 'AI Theme Generator',
      description: description || `AI-generated theme: ${name}`,
      license: 'MIT',
      templates: [...new Set([...templateNames, ...standardTemplates])],
      settings: {
        colors: settings.colors,
        typography: settings.typography,
        spacing: settings.spacing,
      },
      features: features || [],
      supports: {
        widgets: true,
        menus: true,
        customHeader: true,
        customBackground: true,
        postThumbnails: true,
        responsiveEmbeds: true,
        darkMode: features?.includes('darkMode') ?? false,
      },
    };
  }

  /**
   * Generate CSS from theme settings
   */
  generateThemeCSS(settings: CustomThemeSettings): string {
    const { colors, typography, layout, spacing, borders } = settings;

    return `/* AI Generated Theme CSS */
:root {
  /* Colors */
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-text-muted: ${colors.textMuted};
  --color-heading: ${colors.heading};
  --color-link: ${colors.link};
  --color-link-hover: ${colors.linkHover};
  --color-border: ${colors.border};
  --color-success: ${colors.success || '#22c55e'};
  --color-warning: ${colors.warning || '#f59e0b'};
  --color-error: ${colors.error || '#ef4444'};

  /* Typography */
  --font-heading: '${typography.headingFont}', system-ui, sans-serif;
  --font-body: '${typography.bodyFont}', system-ui, sans-serif;
  --font-size-base: ${typography.baseFontSize}px;
  --line-height: ${typography.lineHeight};
  --heading-weight: ${typography.headingWeight};

  /* Layout */
  --content-width: ${layout.contentWidth}px;
  --container-max-width: ${layout.contentWidth}px;

  /* Spacing */
  --section-padding: ${spacing.sectionPadding}px;
  --element-spacing: ${spacing.elementSpacing}px;
  --container-padding: ${spacing.containerPadding}px;
  --block-gap: ${spacing.elementSpacing}px;

  /* Borders */
  --border-radius: ${borders.radius}px;
  --border-width: ${borders.width}px;
}

/* Base Styles */
*, *::before, *::after {
  box-sizing: border-box;
}

html {
  font-size: var(--font-size-base);
  line-height: var(--line-height);
}

body {
  margin: 0;
  font-family: var(--font-body);
  background-color: var(--color-background);
  color: var(--color-text);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: var(--heading-weight);
  color: var(--color-heading);
  line-height: 1.2;
  margin-top: 0;
}

a {
  color: var(--color-link);
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: var(--color-link-hover);
}

img {
  max-width: 100%;
  height: auto;
}

/* Container */
.container {
  width: 100%;
  max-width: var(--container-max-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background-color: var(--color-primary);
  color: #fff;
}

.btn-primary:hover {
  background-color: var(--color-secondary);
  color: #fff;
}

.btn-outline {
  background-color: transparent;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
}

.btn-outline:hover {
  background-color: var(--color-primary);
  color: #fff;
}

.btn-sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

/* Cards */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  overflow: hidden;
}

/* Navigation */
.navbar {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem 0;
  ${layout.headerStyle === 'sticky' ? 'position: sticky; top: 0; z-index: 1000;' : ''}
}

.nav-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
}

.logo {
  font-family: var(--font-heading);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.nav-menu {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: var(--color-text);
  font-weight: 500;
}

.nav-link:hover {
  color: var(--color-primary);
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Hero Section */
.hero {
  padding: calc(var(--section-padding) * 2) 0;
  text-align: center;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: #fff;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: #fff;
}

.hero p {
  font-size: 1.25rem;
  max-width: 600px;
  margin: 0 auto;
  opacity: 0.9;
}

/* Posts Grid */
.posts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.post-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.post-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.post-image {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.post-content {
  padding: 1.5rem;
}

.post-content h3 {
  margin-bottom: 0.5rem;
}

.post-content h3 a {
  color: var(--color-heading);
}

.post-content h3 a:hover {
  color: var(--color-primary);
}

/* Footer */
.site-footer {
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 2rem 0;
  text-align: center;
  color: var(--color-text-muted);
}

/* Sections */
.posts-section {
  padding: var(--section-padding) 0;
}

.posts-section h2 {
  margin-bottom: 2rem;
}

/* Single Post/Page */
.single-post, .page-content {
  padding: var(--section-padding) 0;
}

.featured-image {
  width: 100%;
  max-height: 500px;
  object-fit: cover;
  border-radius: var(--border-radius);
  margin-bottom: 2rem;
}

.post-meta {
  color: var(--color-text-muted);
  margin-bottom: 2rem;
}

.post-body {
  max-width: 800px;
  line-height: 1.8;
}

.post-body p {
  margin-bottom: 1.5rem;
}

/* User Menu */
.user-menu {
  position: relative;
}

.user-menu-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius);
  min-width: 180px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  display: none;
  z-index: 1000;
}

.user-dropdown.active {
  display: block;
}

.dropdown-item {
  display: block;
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: none;
  border: none;
  color: var(--color-text);
  cursor: pointer;
  text-decoration: none;
}

.dropdown-item:hover {
  background: var(--color-background);
}

.dropdown-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0.5rem 0;
}

/* Cart Icon */
.cart-icon {
  position: relative;
  color: var(--color-text);
}

.cart-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--color-primary);
  color: #fff;
  font-size: 0.75rem;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive */
@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }

  .hero h1 {
    font-size: 2rem;
  }

  .posts-grid {
    grid-template-columns: 1fr;
  }
}
`;
  }

  /**
   * Generate complete theme file structure
   */
  generateCompleteThemeFiles(themeData: GeneratedThemeData): {
    themeJson: ThemeJsonConfig;
    css: string;
    readme: string;
  } {
    const themeJson = this.generateThemeJson(themeData);
    const css = this.generateThemeCSS(themeData.settings);

    const readme = `# ${themeData.name}

${themeData.description}

## Features

${(themeData.features || []).map((f) => `- ${f}`).join('\n') || '- Modern, responsive design'}

## Installation

1. Upload the theme folder to your themes directory
2. Activate the theme from the admin panel
3. Customize colors and settings as needed

## Pages Included

${themeData.pages.map((p) => `- ${p.name} (/${p.slug})`).join('\n')}

## Credits

Generated with AI Theme Generator

## License

MIT License
`;

    return {
      themeJson,
      css,
      readme,
    };
  }

  /**
   * List all available AI theme presets
   * Returns simplified preset info for display in the UI
   */
  listPresets(): Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    thumbnail: string;
    tags: string[];
    industry: string;
    style: string;
    colorScheme: string;
    primaryColor: string;
    secondaryColor: string;
  }> {
    return AI_THEME_PRESETS.map((preset) => ({
      id: preset.id,
      name: preset.name,
      description: preset.description,
      category: preset.category,
      thumbnail: preset.thumbnail,
      tags: preset.tags,
      industry: preset.industry,
      style: preset.style,
      colorScheme: preset.colorScheme,
      primaryColor: preset.colors.primary,
      secondaryColor: preset.colors.secondary,
    }));
  }

  /**
   * Get a specific preset by ID
   */
  getPreset(id: string): AiThemePreset | null {
    const preset = AI_THEME_PRESETS.find((p) => p.id === id);
    return preset || null;
  }
}
