import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import { AiThemeGeneratorService, GeneratedThemeData, ThemeJsonConfig } from './ai-theme-generator.service';
import { GenerateAiThemeDto, IndustryType, PageType } from './dto/generate-ai-theme.dto';

describe('AiThemeGeneratorService', () => {
  let service: AiThemeGeneratorService;
  let configService: jest.Mocked<ConfigService>;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        AI_PROVIDER: 'openai',
        OPENAI_API_KEY: 'test-api-key',
        ANTHROPIC_API_KEY: '',
      };
      return config[key] || '';
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiThemeGeneratorService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AiThemeGeneratorService>(AiThemeGeneratorService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateThemeJson', () => {
    const mockThemeData: GeneratedThemeData = {
      name: 'Test Theme',
      description: 'A test theme for unit testing',
      settings: {
        colors: {
          primary: '#3b82f6',
          secondary: '#1e40af',
          accent: '#f59e0b',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          textMuted: '#64748b',
          heading: '#0f172a',
          link: '#3b82f6',
          linkHover: '#1e40af',
          border: '#e2e8f0',
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
          baseFontSize: 16,
          lineHeight: 1.6,
          headingWeight: 700,
        },
        layout: {
          sidebarPosition: 'none',
          contentWidth: 1200,
          headerStyle: 'default',
          footerStyle: 'default',
        },
        spacing: {
          sectionPadding: 48,
          elementSpacing: 24,
          containerPadding: 32,
        },
        borders: {
          radius: 8,
          width: 1,
        },
      },
      pages: [
        {
          id: 'page-1',
          name: 'Home',
          slug: 'home',
          isHomePage: true,
          blocks: [],
        },
        {
          id: 'page-2',
          name: 'About',
          slug: 'about',
          isHomePage: false,
          blocks: [],
        },
      ],
      features: ['darkMode', 'animations'],
    };

    it('should generate valid theme.json config', () => {
      const themeJson = service.generateThemeJson(mockThemeData);

      expect(themeJson.name).toBe('Test Theme');
      expect(themeJson.version).toBe('1.0.0');
      expect(themeJson.author).toBe('AI Theme Generator');
      expect(themeJson.description).toBe('A test theme for unit testing');
      expect(themeJson.license).toBe('MIT');
    });

    it('should include standard templates', () => {
      const themeJson = service.generateThemeJson(mockThemeData);

      expect(themeJson.templates).toContain('header.hbs');
      expect(themeJson.templates).toContain('footer.hbs');
      expect(themeJson.templates).toContain('single-post.hbs');
      expect(themeJson.templates).toContain('single-page.hbs');
    });

    it('should include page-specific templates', () => {
      const themeJson = service.generateThemeJson(mockThemeData);

      expect(themeJson.templates).toContain('home.hbs');
      expect(themeJson.templates).toContain('page-about.hbs');
    });

    it('should set supports.darkMode based on features', () => {
      const themeJson = service.generateThemeJson(mockThemeData);
      expect(themeJson.supports.darkMode).toBe(true);

      const themeDataNoDarkMode = { ...mockThemeData, features: ['animations'] };
      const themeJsonNoDark = service.generateThemeJson(themeDataNoDarkMode);
      expect(themeJsonNoDark.supports.darkMode).toBe(false);
    });

    it('should include color settings', () => {
      const themeJson = service.generateThemeJson(mockThemeData);

      expect(themeJson.settings.colors.primary).toBe('#3b82f6');
      expect(themeJson.settings.colors.secondary).toBe('#1e40af');
      expect(themeJson.settings.colors.accent).toBe('#f59e0b');
    });
  });

  describe('generateThemeCSS', () => {
    const mockSettings = {
      colors: {
        primary: '#3b82f6',
        secondary: '#1e40af',
        accent: '#f59e0b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textMuted: '#64748b',
        heading: '#0f172a',
        link: '#3b82f6',
        linkHover: '#1e40af',
        border: '#e2e8f0',
        success: '#22c55e',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Open Sans',
        baseFontSize: 16,
        lineHeight: 1.6,
        headingWeight: 700,
      },
      layout: {
        sidebarPosition: 'none' as const,
        contentWidth: 1200,
        headerStyle: 'sticky' as const,
        footerStyle: 'default' as const,
      },
      spacing: {
        sectionPadding: 48,
        elementSpacing: 24,
        containerPadding: 32,
      },
      borders: {
        radius: 8,
        width: 1,
      },
    };

    it('should generate CSS with color variables', () => {
      const css = service.generateThemeCSS(mockSettings);

      expect(css).toContain('--color-primary: #3b82f6');
      expect(css).toContain('--color-secondary: #1e40af');
      expect(css).toContain('--color-accent: #f59e0b');
      expect(css).toContain('--color-background: #ffffff');
    });

    it('should generate CSS with typography variables', () => {
      const css = service.generateThemeCSS(mockSettings);

      expect(css).toContain("--font-heading: 'Inter'");
      expect(css).toContain("--font-body: 'Open Sans'");
      expect(css).toContain('--font-size-base: 16px');
      expect(css).toContain('--line-height: 1.6');
    });

    it('should generate CSS with layout variables', () => {
      const css = service.generateThemeCSS(mockSettings);

      expect(css).toContain('--content-width: 1200px');
      expect(css).toContain('--container-max-width: 1200px');
    });

    it('should generate CSS with spacing variables', () => {
      const css = service.generateThemeCSS(mockSettings);

      expect(css).toContain('--section-padding: 48px');
      expect(css).toContain('--element-spacing: 24px');
      expect(css).toContain('--container-padding: 32px');
    });

    it('should include sticky header styles when headerStyle is sticky', () => {
      const css = service.generateThemeCSS(mockSettings);

      expect(css).toContain('position: sticky');
      expect(css).toContain('top: 0');
      expect(css).toContain('z-index: 1000');
    });

    it('should include base styles', () => {
      const css = service.generateThemeCSS(mockSettings);

      expect(css).toContain('box-sizing: border-box');
      expect(css).toContain('font-family: var(--font-body)');
      expect(css).toContain('.container');
      expect(css).toContain('.btn');
      expect(css).toContain('.card');
    });

    it('should include responsive styles', () => {
      const css = service.generateThemeCSS(mockSettings);

      expect(css).toContain('@media (max-width: 768px)');
    });
  });

  describe('generateCompleteThemeFiles', () => {
    const mockThemeData: GeneratedThemeData = {
      name: 'Complete Theme',
      description: 'A complete theme with all files',
      settings: {
        colors: {
          primary: '#3b82f6',
          secondary: '#1e40af',
          accent: '#f59e0b',
          background: '#ffffff',
          surface: '#f8fafc',
          text: '#1e293b',
          textMuted: '#64748b',
          heading: '#0f172a',
          link: '#3b82f6',
          linkHover: '#1e40af',
          border: '#e2e8f0',
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
          baseFontSize: 16,
          lineHeight: 1.6,
          headingWeight: 700,
        },
        layout: {
          sidebarPosition: 'none',
          contentWidth: 1200,
          headerStyle: 'default',
          footerStyle: 'default',
        },
        spacing: {
          sectionPadding: 48,
          elementSpacing: 24,
          containerPadding: 32,
        },
        borders: {
          radius: 8,
          width: 1,
        },
      },
      pages: [
        { id: 'p1', name: 'Home', slug: 'home', isHomePage: true, blocks: [] },
        { id: 'p2', name: 'About', slug: 'about', isHomePage: false, blocks: [] },
      ],
      features: ['darkMode', 'animations', 'responsiveImages'],
    };

    it('should generate all theme files', () => {
      const files = service.generateCompleteThemeFiles(mockThemeData);

      expect(files.themeJson).toBeDefined();
      expect(files.css).toBeDefined();
      expect(files.readme).toBeDefined();
    });

    it('should generate valid theme.json', () => {
      const files = service.generateCompleteThemeFiles(mockThemeData);

      expect(files.themeJson.name).toBe('Complete Theme');
      expect(files.themeJson.version).toBe('1.0.0');
      expect(files.themeJson.templates).toBeInstanceOf(Array);
    });

    it('should generate readme with features', () => {
      const files = service.generateCompleteThemeFiles(mockThemeData);

      expect(files.readme).toContain('# Complete Theme');
      expect(files.readme).toContain('- darkMode');
      expect(files.readme).toContain('- animations');
      expect(files.readme).toContain('- responsiveImages');
    });

    it('should list pages in readme', () => {
      const files = service.generateCompleteThemeFiles(mockThemeData);

      expect(files.readme).toContain('- Home (/home)');
      expect(files.readme).toContain('- About (/about)');
    });
  });
});

