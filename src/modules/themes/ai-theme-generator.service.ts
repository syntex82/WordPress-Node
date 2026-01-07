/**
 * AI Theme Generator Service - Enhanced Version
 * Generates comprehensive, production-ready theme configurations using AI
 * Supports full theme structure with content blocks, templates, and assets
 */

import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomThemeSettings, ThemePageData, ContentBlockData } from './custom-themes.service';
import { GenerateAiThemeDto, PageType, ContentBlockType, IndustryType } from './dto/generate-ai-theme.dto';
import { v4 as uuid } from 'uuid';

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
   * Generate comprehensive theme using AI
   */
  async generateTheme(dto: GenerateAiThemeDto, userId: string): Promise<GeneratedThemeData> {
    if (!this.isConfigured) {
      throw new ServiceUnavailableException(
        'AI Theme Generator is not configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env',
      );
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
        throw new ServiceUnavailableException('No AI provider configured');
      }
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new ServiceUnavailableException(
        `AI generation failed: ${error.message || 'Unknown error'}`,
      );
    }
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
        max_tokens: 8000,
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
        max_tokens: 8000,
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
   * Comprehensive system prompt with all content block types and page templates
   */
  private getComprehensiveSystemPrompt(): string {
    return `You are an expert web designer and theme creator specializing in modern, production-ready website themes. Generate comprehensive theme configurations with full content blocks, page templates, and styling.

## AVAILABLE CONTENT BLOCK TYPES

Generate blocks using these types with their required props:

### Hero Blocks
- "hero": { title, subtitle, backgroundImage?, ctaText, ctaUrl, alignment?, overlayOpacity? }
- "heroVideo": { title, subtitle, videoUrl, ctaText, ctaUrl }
- "heroSlider": { slides: [{ title, subtitle, image, ctaText, ctaUrl }] }

### Feature Blocks
- "features": { title, subtitle?, columns: 2|3|4, features: [{ icon?, title, description, link? }] }
- "featureCards": { title, cards: [{ icon, title, description, image? }] }
- "featureGrid": { title, items: [{ icon, title, description }], columns: 3|4 }

### Content Blocks
- "textBlock": { content, alignment? }
- "richText": { html }
- "imageText": { image, title, text, imagePosition: "left"|"right", ctaText?, ctaUrl? }
- "twoColumn": { leftContent, rightContent }
- "threeColumn": { columns: [{ title, content }] }

### Media Blocks
- "gallery": { title?, images: [{ src, alt, caption? }], columns: 2|3|4, lightbox? }
- "video": { title?, videoUrl, thumbnail?, autoplay? }
- "audio": { title?, audioUrl, showWaveform? }
- "imageCarousel": { images: [{ src, alt }], autoplay?, interval? }

### Testimonial & Social Proof
- "testimonials": { title, testimonials: [{ quote, author, role?, company?, avatar? }], layout: "grid"|"slider" }
- "logoCloud": { title?, logos: [{ src, alt, url? }] }
- "socialProof": { stats: [{ value, label }], title? }
- "reviews": { title, reviews: [{ rating, text, author, date }] }

### Pricing & Commerce
- "pricing": { title, subtitle?, plans: [{ name, price, period, features: [], ctaText, ctaUrl, featured? }] }
- "productGrid": { title, products: [{ name, price, image, description, url }], columns: 3|4 }
- "productShowcase": { product: { name, price, images: [], description, features: [], ctaText } }

### Call to Action
- "cta": { title, subtitle?, ctaText, ctaUrl, backgroundColor?, style: "simple"|"split"|"centered" }
- "ctaBanner": { title, ctaText, ctaUrl, backgroundImage? }
- "newsletter": { title, subtitle?, placeholder?, buttonText, successMessage? }

### Team & About
- "teamGrid": { title, members: [{ name, role, image, bio?, social?: { twitter?, linkedin?, email? } }] }
- "teamCarousel": { title, members: [...] }
- "about": { title, content, image?, stats?: [{ value, label }] }
- "timeline": { title, events: [{ date, title, description }] }

### Blog & Content
- "blogPosts": { title, posts: [{ title, excerpt, image, date, author, url }], columns: 2|3, showExcerpt? }
- "blogGrid": { title, postsPerPage: 6|9|12, showCategories?, showAuthor? }
- "categories": { title, categories: [{ name, count, url, image? }] }

### Course & Education
- "courseGrid": { title, courses: [{ title, instructor, image, price, rating, duration, url }], columns: 3|4 }
- "courseShowcase": { course: { title, description, instructor, modules: [], price, ctaText } }
- "curriculum": { title, modules: [{ title, lessons: [{ title, duration, type }] }] }

### Interactive Elements
- "accordion": { title?, items: [{ title, content }], allowMultiple? }
- "tabs": { tabs: [{ title, content }] }
- "countdown": { title, targetDate, style: "simple"|"cards" }
- "progressBar": { items: [{ label, value, max }] }

### Forms & Contact
- "contactForm": { title, fields: [{ type, label, required?, placeholder? }], submitText, successMessage }
- "contactInfo": { title, email?, phone?, address?, hours?, mapEmbed? }
- "map": { title?, latitude, longitude, zoom?, marker? }

### Stats & Data
- "stats": { title?, stats: [{ value, label, icon? }], columns: 3|4 }
- "counters": { counters: [{ value, label, prefix?, suffix? }] }
- "charts": { title, type: "bar"|"line"|"pie", data: [...] }

### Footer Blocks
- "footerSimple": { copyright, links: [{ text, url }], social?: [...] }
- "footerMultiColumn": { columns: [{ title, links: [{ text, url }] }], copyright, social? }
- "footerCta": { title, ctaText, ctaUrl, copyright }

## PAGE TEMPLATES

Generate pages appropriate for the industry:

- home: Hero + Features + Testimonials + CTA
- about: About + Team + Timeline + Stats
- services: Features + Pricing + Testimonials + CTA
- products: ProductGrid + ProductShowcase + Reviews
- blog: BlogGrid + Categories + Newsletter
- contact: ContactForm + ContactInfo + Map
- pricing: Pricing + FAQ + CTA
- faq: Accordion + ContactInfo
- team: TeamGrid + About
- portfolio: Gallery + Testimonials
- courses: CourseGrid + Testimonials + FAQ
- shop: ProductGrid + Categories + Newsletter
- checkout: (minimal blocks, focus on form)
- login/register: (auth forms)

## OUTPUT FORMAT

Return ONLY valid JSON with this structure:
{
  "settings": {
    "colors": { primary, secondary, accent, background, surface, text, textMuted, heading, link, linkHover, border, success, warning, error },
    "typography": { headingFont, bodyFont, baseFontSize, lineHeight, headingWeight, headingLineHeight },
    "layout": { sidebarPosition, contentWidth, headerStyle, footerStyle, containerMaxWidth },
    "spacing": { sectionPadding, elementSpacing, containerPadding, blockGap },
    "borders": { radius, width, style },
    "shadows": { small, medium, large },
    "animations": { enabled, duration, easing }
  },
  "pages": [
    {
      "id": "uuid",
      "name": "Page Name",
      "slug": "page-slug",
      "isHomePage": boolean,
      "template": "template-name",
      "seo": { title, description, keywords },
      "blocks": [
        {
          "id": "uuid",
          "type": "block-type",
          "props": { ...blockProps }
        }
      ]
    }
  ],
  "themeJson": {
    "name": "Theme Name",
    "version": "1.0.0",
    "templates": ["home", "about", ...],
    "features": ["darkMode", "animations", ...]
  }
}

Generate realistic, industry-appropriate content. Use proper UUIDs. Ensure accessibility and responsive design considerations.`;
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
      parts.push(`\n## Primary Color\n${dto.primaryColor} - Use this as the base for the color palette`);
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
      parts.push(`\n## Courses/LMS\nInclude course grids, curriculum blocks, and learning features`);
    }

    if (dto.includeBlog) {
      parts.push(`\n## Blog\nInclude blog grid, categories, and newsletter signup`);
    }

    if (dto.generateFullTheme) {
      parts.push(`\n## Full Theme Generation\nGenerate a complete, production-ready theme with all pages fully populated with realistic content`);
    }

    parts.push(`\n\nGenerate a complete, professional theme configuration with realistic content appropriate for the industry and requirements.`);

    return parts.join('\n');
  }

  /**
   * Parse comprehensive AI response
   */
  private parseComprehensiveAiResponse(content: string, dto: GenerateAiThemeDto): GeneratedThemeData {
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
  private generateBlocksForPageType(pageType: PageType, dto: GenerateAiThemeDto): ContentBlockData[] {
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

  // Block creation methods
  private createHeroBlock(dto: GenerateAiThemeDto, title?: string): ContentBlockData {
    return {
      id: uuid(),
      type: 'hero',
      props: {
        title: title || 'Welcome to Your Site',
        subtitle: dto.description || 'Created with AI Theme Designer',
        backgroundImage: null,
        ctaText: 'Get Started',
        ctaUrl: '#',
        alignment: 'center',
      },
    };
  }

  private createFeaturesBlock(_dto: GenerateAiThemeDto): ContentBlockData {
    return {
      id: uuid(),
      type: 'features',
      props: {
        title: 'Key Features',
        subtitle: 'Everything you need to succeed',
        columns: 3,
        features: [
          { icon: '🚀', title: 'Fast & Reliable', description: 'Lightning-fast performance' },
          { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' },
          { icon: '📱', title: 'Responsive', description: 'Works on all devices' },
        ],
      },
    };
  }

  private createTestimonialsBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'testimonials',
      props: {
        title: 'What Our Customers Say',
        layout: 'grid',
        testimonials: [
          { quote: 'Amazing service!', author: 'John Doe', role: 'CEO', company: 'Tech Corp' },
          { quote: 'Highly recommended!', author: 'Jane Smith', role: 'Designer', company: 'Creative Co' },
        ],
      },
    };
  }

  private createCtaBlock(_dto: GenerateAiThemeDto): ContentBlockData {
    return {
      id: uuid(),
      type: 'cta',
      props: {
        title: 'Ready to Get Started?',
        subtitle: 'Join thousands of satisfied customers',
        ctaText: 'Start Now',
        ctaUrl: '#',
        style: 'centered',
      },
    };
  }

  private createProductGridBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'productGrid',
      props: {
        title: 'Featured Products',
        columns: 4,
        products: [
          { name: 'Product 1', price: '$99', image: '', description: 'Great product', url: '#' },
          { name: 'Product 2', price: '$149', image: '', description: 'Amazing product', url: '#' },
          { name: 'Product 3', price: '$199', image: '', description: 'Premium product', url: '#' },
        ],
      },
    };
  }

  private createCourseGridBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'courseGrid',
      props: {
        title: 'Popular Courses',
        columns: 3,
        courses: [
          { title: 'Course 1', instructor: 'John Doe', image: '', price: '$49', rating: 4.8, duration: '10h', url: '#' },
          { title: 'Course 2', instructor: 'Jane Smith', image: '', price: '$79', rating: 4.9, duration: '15h', url: '#' },
        ],
      },
    };
  }

  private createAboutBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'about',
      props: {
        title: 'About Us',
        content: 'We are a passionate team dedicated to delivering excellence.',
        image: null,
        stats: [
          { value: '10+', label: 'Years Experience' },
          { value: '500+', label: 'Happy Clients' },
          { value: '1000+', label: 'Projects Completed' },
        ],
      },
    };
  }

  private createTeamGridBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'teamGrid',
      props: {
        title: 'Meet Our Team',
        members: [
          { name: 'John Doe', role: 'CEO', image: '', bio: 'Visionary leader' },
          { name: 'Jane Smith', role: 'CTO', image: '', bio: 'Tech expert' },
          { name: 'Bob Johnson', role: 'Designer', image: '', bio: 'Creative mind' },
        ],
      },
    };
  }

  private createTimelineBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'timeline',
      props: {
        title: 'Our Journey',
        events: [
          { date: '2020', title: 'Founded', description: 'Started our journey' },
          { date: '2022', title: 'Growth', description: 'Expanded our team' },
          { date: '2024', title: 'Innovation', description: 'Launched new products' },
        ],
      },
    };
  }

  private createStatsBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'stats',
      props: {
        stats: [
          { value: '99%', label: 'Customer Satisfaction' },
          { value: '24/7', label: 'Support' },
          { value: '50+', label: 'Countries' },
        ],
        columns: 3,
      },
    };
  }

  private createFeatureCardsBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'featureCards',
      props: {
        title: 'Our Services',
        cards: [
          { icon: '💼', title: 'Consulting', description: 'Expert advice for your business' },
          { icon: '🎨', title: 'Design', description: 'Beautiful, modern designs' },
          { icon: '⚙️', title: 'Development', description: 'Custom solutions built for you' },
        ],
      },
    };
  }

  private createPricingBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'pricing',
      props: {
        title: 'Choose Your Plan',
        subtitle: 'Simple, transparent pricing',
        plans: [
          { name: 'Starter', price: '$9', period: '/month', features: ['Feature 1', 'Feature 2'], ctaText: 'Get Started', ctaUrl: '#' },
          { name: 'Pro', price: '$29', period: '/month', features: ['All Starter features', 'Feature 3', 'Feature 4'], ctaText: 'Get Started', ctaUrl: '#', featured: true },
          { name: 'Enterprise', price: '$99', period: '/month', features: ['All Pro features', 'Feature 5', 'Priority support'], ctaText: 'Contact Us', ctaUrl: '#' },
        ],
      },
    };
  }

  private createBlogGridBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'blogPosts',
      props: {
        title: 'Latest Articles',
        columns: 3,
        showExcerpt: true,
        posts: [
          { title: 'Getting Started', excerpt: 'Learn the basics...', image: '', date: '2024-01-15', author: 'John Doe', url: '#' },
          { title: 'Advanced Tips', excerpt: 'Take it to the next level...', image: '', date: '2024-01-10', author: 'Jane Smith', url: '#' },
        ],
      },
    };
  }

  private createNewsletterBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'newsletter',
      props: {
        title: 'Subscribe to Our Newsletter',
        subtitle: 'Get the latest updates delivered to your inbox',
        placeholder: 'Enter your email',
        buttonText: 'Subscribe',
        successMessage: 'Thanks for subscribing!',
      },
    };
  }

  private createContactFormBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'contactForm',
      props: {
        title: 'Get in Touch',
        fields: [
          { type: 'text', label: 'Name', required: true, placeholder: 'Your name' },
          { type: 'email', label: 'Email', required: true, placeholder: 'your@email.com' },
          { type: 'textarea', label: 'Message', required: true, placeholder: 'Your message' },
        ],
        submitText: 'Send Message',
        successMessage: 'Thank you! We will get back to you soon.',
      },
    };
  }

  private createContactInfoBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'contactInfo',
      props: {
        title: 'Contact Information',
        email: 'hello@example.com',
        phone: '+1 (555) 123-4567',
        address: '123 Main Street, City, Country',
        hours: 'Mon-Fri: 9am-5pm',
      },
    };
  }

  private createAccordionBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'accordion',
      props: {
        title: 'Frequently Asked Questions',
        allowMultiple: false,
        items: [
          { title: 'What is your return policy?', content: 'We offer a 30-day money-back guarantee.' },
          { title: 'How do I contact support?', content: 'You can reach us via email or phone.' },
          { title: 'Do you offer discounts?', content: 'Yes, we offer various discounts for annual plans.' },
        ],
      },
    };
  }

  private createGalleryBlock(): ContentBlockData {
    return {
      id: uuid(),
      type: 'gallery',
      props: {
        title: 'Our Work',
        columns: 3,
        lightbox: true,
        images: [
          { src: '', alt: 'Project 1', caption: 'Amazing project' },
          { src: '', alt: 'Project 2', caption: 'Creative work' },
          { src: '', alt: 'Project 3', caption: 'Innovative design' },
        ],
      },
    };
  }

  /**
   * Create block by type
   */
  private createBlockByType(blockType: ContentBlockType, dto: GenerateAiThemeDto): ContentBlockData | null {
    const blockCreators: Record<string, () => ContentBlockData> = {
      hero: () => this.createHeroBlock(dto),
      features: () => this.createFeaturesBlock(dto),
      testimonials: () => this.createTestimonialsBlock(),
      cta: () => this.createCtaBlock(dto),
      productGrid: () => this.createProductGridBlock(),
      courseGrid: () => this.createCourseGridBlock(),
      pricing: () => this.createPricingBlock(),
      stats: () => this.createStatsBlock(),
      timeline: () => this.createTimelineBlock(),
      accordion: () => this.createAccordionBlock(),
      newsletter: () => this.createNewsletterBlock(),
      teamGrid: () => this.createTeamGridBlock(),
      contactForm: () => this.createContactFormBlock(),
      gallery: () => this.createGalleryBlock(),
      blogPosts: () => this.createBlogGridBlock(),
    };

    const creator = blockCreators[blockType];
    return creator ? creator() : null;
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

    const templateNames = pages.map(p => {
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

${(themeData.features || []).map(f => `- ${f}`).join('\n') || '- Modern, responsive design'}

## Installation

1. Upload the theme folder to your themes directory
2. Activate the theme from the admin panel
3. Customize colors and settings as needed

## Pages Included

${themeData.pages.map(p => `- ${p.name} (/${p.slug})`).join('\n')}

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
}
