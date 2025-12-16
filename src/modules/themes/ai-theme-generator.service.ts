/**
 * AI Theme Generator Service
 * Generates theme configurations using AI (OpenAI or Anthropic)
 */

import { Injectable, BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CustomThemeSettings, ThemePageData, ContentBlockData } from './custom-themes.service';
import { GenerateAiThemeDto } from './dto/generate-ai-theme.dto';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AiThemeGeneratorService {
  private aiProvider: 'openai' | 'anthropic';
  private openaiApiKey: string;
  private anthropicApiKey: string;
  private rateLimitMap: Map<string, number[]> = new Map();

  constructor(private configService: ConfigService) {
    this.aiProvider = (this.configService.get('AI_PROVIDER') || 'openai') as 'openai' | 'anthropic';
    this.openaiApiKey = this.configService.get('OPENAI_API_KEY') || '';
    this.anthropicApiKey = this.configService.get('ANTHROPIC_API_KEY') || '';

    if (!this.openaiApiKey && !this.anthropicApiKey) {
      throw new Error(
        'No AI API keys configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env',
      );
    }
  }

  /**
   * Check rate limit for user
   */
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
   * Generate theme using AI
   */
  async generateTheme(dto: GenerateAiThemeDto, userId: string) {
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
      throw new ServiceUnavailableException(
        `AI generation failed: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Generate theme with OpenAI
   */
  private async generateWithOpenAI(dto: GenerateAiThemeDto) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(),
          },
          {
            role: 'user',
            content: this.buildUserPrompt(dto),
          },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    return this.parseAiResponse(content, dto);
  }

  /**
   * Generate theme with Anthropic Claude
   */
  private async generateWithAnthropic(dto: GenerateAiThemeDto) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        system: this.getSystemPrompt(),
        messages: [
          {
            role: 'user',
            content: this.buildUserPrompt(dto),
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.content[0].text;
    return this.parseAiResponse(content, dto);
  }

  /**
   * Get system prompt for AI
   */
  private getSystemPrompt(): string {
    return `You are an expert web designer and theme creator. Generate professional, modern theme configurations based on user descriptions.

Return ONLY valid JSON (no markdown, no code blocks) with this exact structure:
{
  "settings": {
    "colors": {
      "primary": "#hex",
      "secondary": "#hex",
      "accent": "#hex",
      "background": "#hex",
      "surface": "#hex",
      "text": "#hex",
      "textMuted": "#hex",
      "heading": "#hex",
      "link": "#hex",
      "linkHover": "#hex",
      "border": "#hex"
    },
    "typography": {
      "headingFont": "font-name",
      "bodyFont": "font-name",
      "baseFontSize": 16,
      "lineHeight": 1.6,
      "headingWeight": 600
    },
    "layout": {
      "sidebarPosition": "none|left|right",
      "contentWidth": 1200,
      "headerStyle": "default|sticky|minimal|centered",
      "footerStyle": "default|minimal|centered"
    },
    "spacing": {
      "sectionPadding": 32,
      "elementSpacing": 16,
      "containerPadding": 24
    },
    "borders": {
      "radius": 8,
      "width": 1
    }
  },
  "pages": [
    {
      "id": "uuid",
      "name": "Home",
      "slug": "home",
      "isHomePage": true,
      "blocks": []
    }
  ]
}

Ensure all colors are valid hex codes, fonts are web-safe, and values are reasonable.`;
  }

  /**
   * Build user prompt
   */
  private buildUserPrompt(dto: GenerateAiThemeDto): string {
    let prompt = `Create a theme with the following requirements:\n\n`;
    prompt += `Description: ${dto.prompt}\n`;

    if (dto.style) {
      prompt += `Style: ${dto.style}\n`;
    }

    if (dto.colorScheme) {
      prompt += `Color Scheme: ${dto.colorScheme}\n`;
    }

    const pages = dto.numberOfPages || 1;
    prompt += `Number of pages: ${pages}\n`;

    prompt += `\nGenerate a complete, production-ready theme configuration.`;

    return prompt;
  }

  /**
   * Parse AI response
   */
  private parseAiResponse(content: string, dto: GenerateAiThemeDto) {
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);

      // Validate and enhance response
      const settings = this.validateSettings(parsed.settings);
      const pages = this.generatePages(parsed.pages || [], dto.numberOfPages || 1);

      return {
        settings,
        pages,
        name: dto.themeName || `AI Theme ${new Date().toLocaleDateString()}`,
        description: dto.description || `Generated with AI: ${dto.prompt.substring(0, 100)}...`,
      };
    } catch (error) {
      throw new BadRequestException('Failed to parse AI response. Please try again.');
    }
  }

  /**
   * Validate and fix theme settings
   */
  private validateSettings(settings: any): CustomThemeSettings {
    const defaults: CustomThemeSettings = {
      colors: {
        primary: '#3b82f6',
        secondary: '#1d4ed8',
        accent: '#3b82f6',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#334155',
        textMuted: '#64748b',
        heading: '#0f172a',
        link: '#3b82f6',
        linkHover: '#1d4ed8',
        border: '#e2e8f0',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
        baseFontSize: 16,
        lineHeight: 1.6,
        headingWeight: 600,
      },
      layout: {
        sidebarPosition: 'none',
        contentWidth: 1200,
        headerStyle: 'default',
        footerStyle: 'default',
      },
      spacing: {
        sectionPadding: 32,
        elementSpacing: 16,
        containerPadding: 24,
      },
      borders: {
        radius: 8,
        width: 1,
      },
    };

    return { ...defaults, ...settings };
  }

  /**
   * Generate page templates
   */
  private generatePages(pages: any[], count: number): ThemePageData[] {
    const generatedPages: ThemePageData[] = [];

    for (let i = 0; i < count; i++) {
      const isHome = i === 0;
      generatedPages.push({
        id: uuid(),
        name: isHome ? 'Home' : `Page ${i}`,
        slug: isHome ? 'home' : `page-${i}`,
        isHomePage: isHome,
        blocks: this.generateDefaultBlocks(isHome),
      });
    }

    return generatedPages;
  }

  /**
   * Generate default blocks for a page
   */
  private generateDefaultBlocks(isHomePage: boolean): ContentBlockData[] {
    const blocks: ContentBlockData[] = [];

    if (isHomePage) {
      // Hero block
      blocks.push({
        id: uuid(),
        type: 'hero',
        props: {
          title: 'Welcome to Your Site',
          subtitle: 'Created with AI Theme Designer',
          backgroundImage: null,
          ctaText: 'Get Started',
          ctaUrl: '#',
        },
      });

      // Features block
      blocks.push({
        id: uuid(),
        type: 'features',
        props: {
          title: 'Key Features',
          features: [
            { title: 'Feature 1', description: 'Description here' },
            { title: 'Feature 2', description: 'Description here' },
            { title: 'Feature 3', description: 'Description here' },
          ],
        },
      });
    }

    return blocks;
  }
}
