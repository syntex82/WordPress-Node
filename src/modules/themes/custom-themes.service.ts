/**
 * Custom Themes Service
 * Handles CRUD operations for user-created themes from Theme Designer
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as AdmZip from 'adm-zip';

export interface CustomThemeSettings {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    heading: string;
    link: string;
    linkHover: string;
    border: string;
    accent: string;
    success?: string;
    warning?: string;
    error?: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: number;
    lineHeight: number;
    headingWeight: number;
    h1Size?: number;
    h2Size?: number;
    h3Size?: number;
    h4Size?: number;
    h5Size?: number;
    h6Size?: number;
  };
  layout: {
    sidebarPosition: 'left' | 'right' | 'none';
    contentWidth: number;
    headerStyle: 'default' | 'centered' | 'minimal' | 'sticky';
    footerStyle: 'default' | 'centered' | 'minimal';
  };
  spacing: {
    sectionPadding: number;
    elementSpacing: number;
    containerPadding: number;
  };
  borders: {
    radius: number;
    width: number;
  };
  components?: {
    buttons?: {
      borderRadius?: number;
      padding?: string;
      fontWeight?: number;
    };
    cards?: {
      borderRadius?: number;
      shadow?: string;
      padding?: number;
    };
    forms?: {
      borderRadius?: number;
      borderWidth?: number;
      focusColor?: string;
    };
  };
  responsive?: {
    tablet?: Partial<CustomThemeSettings>;
    mobile?: Partial<CustomThemeSettings>;
  };
  darkMode?: Partial<CustomThemeSettings['colors']>;
}

// Page structure for multi-page themes
export interface ThemePageData {
  id: string;
  name: string;
  slug: string;
  blocks: ContentBlockData[];
  isHomePage?: boolean;
}

// Content block structure
export interface ContentBlockData {
  id: string;
  type: string;
  props: Record<string, any>;
  link?: { url?: string; target?: string; enabled?: boolean };
  visibility?: { desktop?: boolean; tablet?: boolean; mobile?: boolean };
  animation?: { type?: string; duration?: number; delay?: number };
}

export interface CreateCustomThemeDto {
  name: string;
  description?: string;
  settings: CustomThemeSettings;
  customCSS?: string;
  pages?: ThemePageData[];
  isDefault?: boolean;
}

export interface UpdateCustomThemeDto {
  name?: string;
  description?: string;
  settings?: CustomThemeSettings;
  customCSS?: string;
  pages?: ThemePageData[];
  isDefault?: boolean;
}

@Injectable()
export class CustomThemesService {
  private readonly themesDir: string;

  constructor(private prisma: PrismaService) {
    this.themesDir = path.join(process.cwd(), 'themes');
  }

  /**
   * Get all custom themes
   */
  async findAll(_userId?: string) {
    return this.prisma.customTheme.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Get custom theme by ID
   */
  async findById(id: string) {
    const theme = await this.prisma.customTheme.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!theme) {
      throw new NotFoundException('Custom theme not found');
    }

    return theme;
  }

  /**
   * Get active custom theme
   */
  async getActiveTheme() {
    return this.prisma.customTheme.findFirst({
      where: { isActive: true },
    });
  }

  /**
   * Create a new custom theme
   */
  async create(dto: CreateCustomThemeDto, userId: string) {
    // Check for duplicate name
    const existing = await this.prisma.customTheme.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Theme with name "${dto.name}" already exists`);
    }

    // If this is set as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.customTheme.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    return this.prisma.customTheme.create({
      data: {
        name: dto.name,
        description: dto.description,
        settings: dto.settings as any,
        customCSS: dto.customCSS,
        pages: dto.pages as any,
        isDefault: dto.isDefault || false,
        createdById: userId,
      } as any,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Update a custom theme
   */
  async update(id: string, dto: UpdateCustomThemeDto) {
    const theme = await this.findById(id);

    // Check for duplicate name if changing
    if (dto.name && dto.name !== theme.name) {
      const existing = await this.prisma.customTheme.findUnique({
        where: { name: dto.name },
      });
      if (existing) {
        throw new ConflictException(`Theme with name "${dto.name}" already exists`);
      }
    }

    // If setting as default, unset other defaults
    if (dto.isDefault) {
      await this.prisma.customTheme.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.customTheme.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.settings && { settings: dto.settings as any }),
        ...(dto.customCSS !== undefined && { customCSS: dto.customCSS }),
        ...(dto.pages !== undefined && { pages: dto.pages as any }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Delete a custom theme
   */
  async delete(id: string) {
    const theme = await this.findById(id);

    if (theme.isActive) {
      throw new BadRequestException(
        'Cannot delete the active theme. Please activate another theme first.',
      );
    }

    return this.prisma.customTheme.delete({
      where: { id },
    });
  }

  /**
   * Duplicate a custom theme
   */
  async duplicate(id: string, userId: string, newName?: string) {
    const theme = await this.findById(id);

    // Generate unique name
    let name = newName || `${theme.name} (Copy)`;
    let counter = 1;
    while (await this.prisma.customTheme.findUnique({ where: { name } })) {
      name = newName ? `${newName} (${counter})` : `${theme.name} (Copy ${counter})`;
      counter++;
    }

    return this.prisma.customTheme.create({
      data: {
        name,
        description: theme.description,
        settings: theme.settings as any,
        customCSS: theme.customCSS,
        isDefault: false,
        isActive: false,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Activate a custom theme
   */
  async activate(id: string) {
    await this.findById(id);

    // Deactivate all custom themes
    await this.prisma.customTheme.updateMany({
      data: { isActive: false },
    });

    return this.prisma.customTheme.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Export theme as JSON
   */
  async exportTheme(id: string) {
    const theme = await this.findById(id);
    return {
      name: theme.name,
      description: theme.description,
      settings: theme.settings,
      customCSS: theme.customCSS,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
  }

  /**
   * Import theme from JSON
   */
  async importTheme(data: any, userId: string) {
    if (!data.name || !data.settings) {
      throw new BadRequestException('Invalid theme data: missing name or settings');
    }

    // Generate unique name if exists
    let name = data.name;
    let counter = 1;
    while (await this.prisma.customTheme.findUnique({ where: { name } })) {
      name = `${data.name} (Imported ${counter})`;
      counter++;
    }

    return this.prisma.customTheme.create({
      data: {
        name,
        description: data.description,
        settings: data.settings,
        customCSS: data.customCSS,
        isDefault: false,
        isActive: false,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  /**
   * Generate CSS from theme settings - includes full styling rules
   */
  generateCSS(settings: CustomThemeSettings, customCSS?: string): string {
    const { colors, typography, layout, spacing, borders } = settings;

    let css = `/* Generated Theme CSS */
:root {
  /* Colors */
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
  --color-text: ${colors.text};
  --color-text-muted: ${colors.textMuted};
  --color-heading: ${colors.heading};
  --color-link: ${colors.link};
  --color-link-hover: ${colors.linkHover};
  --color-border: ${colors.border};
  --color-accent: ${colors.accent};
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

  /* Spacing */
  --section-padding: ${spacing.sectionPadding}px;
  --element-spacing: ${spacing.elementSpacing}px;
  --container-padding: ${spacing.containerPadding}px;

  /* Borders */
  --border-radius: ${borders.radius}px;
  --border-width: ${borders.width}px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --transition: all 0.3s ease;
}

/* Reset & Base */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { font-size: var(--font-size-base); scroll-behavior: smooth; }
body {
  font-family: var(--font-body);
  font-size: 1rem;
  line-height: var(--line-height);
  color: var(--color-text);
  background-color: var(--color-background);
  -webkit-font-smoothing: antialiased;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: var(--heading-weight);
  color: var(--color-heading);
  line-height: 1.2;
  margin-bottom: var(--element-spacing);
}
h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.75rem; }
h4 { font-size: 1.5rem; }
h5 { font-size: 1.25rem; }
h6 { font-size: 1rem; }
p { margin-bottom: var(--element-spacing); }
a { color: var(--color-link); text-decoration: none; transition: var(--transition); }
a:hover { color: var(--color-link-hover); }
img { max-width: 100%; height: auto; display: block; }

/* Layout */
.container { max-width: var(--content-width); margin: 0 auto; padding: 0 var(--container-padding); }
.main-content { min-height: calc(100vh - 200px); padding: var(--section-padding) 0; }

/* Navigation */
.navbar {
  background: var(--color-surface);
  border-bottom: var(--border-width) solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 1000;
  backdrop-filter: blur(10px);
}
.nav-wrapper { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; }
.logo { font-size: 1.5rem; font-weight: 700; color: var(--color-heading); }
.logo:hover { color: var(--color-primary); }
.nav-menu { display: flex; gap: 1.5rem; align-items: center; }
.nav-link { font-weight: 500; color: var(--color-text); padding: 0.5rem 1rem; border-radius: var(--border-radius); }
.nav-link:hover { background: var(--color-primary); color: #fff; }

/* Hero Section */
.hero {
  padding: calc(var(--section-padding) * 2) 0;
  text-align: center;
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-background) 100%);
}
.hero h1 { font-size: 3rem; margin-bottom: 1rem; }
.hero p { font-size: 1.25rem; color: var(--color-text-muted); max-width: 600px; margin: 0 auto; }

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  border-radius: var(--border-radius);
  border: none;
  cursor: pointer;
  transition: var(--transition);
  text-decoration: none;
}
.btn-primary { background: var(--color-primary); color: #fff; }
.btn-primary:hover { background: var(--color-link-hover); color: #fff; }
.btn-secondary { background: var(--color-secondary); color: #fff; }
.btn-outline { background: transparent; border: 2px solid var(--color-primary); color: var(--color-primary); }
.btn-outline:hover { background: var(--color-primary); color: #fff; }
.btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }

/* Cards */
.card {
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--element-spacing);
  transition: var(--transition);
}
.card:hover { box-shadow: var(--shadow-md); }

/* Posts Grid */
.posts-section { padding: var(--section-padding) 0; }
.posts-section h2 { text-align: center; margin-bottom: calc(var(--section-padding) / 2); }
.posts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: var(--element-spacing); }

.post-card {
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: var(--transition);
}
.post-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); }
.post-image { width: 100%; height: 200px; object-fit: cover; }
.post-content { padding: var(--element-spacing); }
.post-content h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
.post-content h3 a { color: var(--color-heading); }
.post-content h3 a:hover { color: var(--color-primary); }
.post-content p { color: var(--color-text-muted); font-size: 0.9rem; }

/* Single Post/Page */
.single-post, .page-content { padding: var(--section-padding) 0; }
.single-post .container, .page-content .container { max-width: 800px; }
.featured-image { width: 100%; height: 400px; object-fit: cover; border-radius: var(--border-radius); margin-bottom: var(--element-spacing); }
.post-meta { color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: var(--element-spacing); }
.post-body { font-size: 1.1rem; line-height: 1.8; }
.post-body p { margin-bottom: 1.5rem; }
.post-body h2, .post-body h3 { margin-top: 2rem; }
.post-body img { border-radius: var(--border-radius); margin: 1.5rem 0; }
.post-body blockquote {
  border-left: 4px solid var(--color-primary);
  padding-left: 1.5rem;
  margin: 1.5rem 0;
  font-style: italic;
  color: var(--color-text-muted);
}
.post-body pre {
  background: var(--color-surface);
  padding: 1rem;
  border-radius: var(--border-radius);
  overflow-x: auto;
}
.post-body code {
  background: var(--color-surface);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

/* Footer */
.site-footer {
  background: var(--color-surface);
  border-top: var(--border-width) solid var(--color-border);
  padding: var(--section-padding) 0;
  text-align: center;
  color: var(--color-text-muted);
}

/* Responsive */
@media (max-width: 768px) {
  h1 { font-size: 2rem; }
  .hero h1 { font-size: 2.25rem; }
  .nav-menu { gap: 0.5rem; }
  .nav-link { padding: 0.5rem; font-size: 0.9rem; }
  .posts-grid { grid-template-columns: 1fr; }
}
`;

    if (customCSS) {
      css += `\n/* Custom CSS */\n${customCSS}`;
    }

    return css;
  }

  /**
   * Install custom theme as a full theme (creates actual theme files)
   */
  async installTheme(id: string) {
    const theme = await this.findById(id);
    const settings = theme.settings as unknown as CustomThemeSettings;

    // Create slug from name
    const slug = theme.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if theme already exists in installed themes
    const existingTheme = await this.prisma.theme.findUnique({
      where: { slug },
    });
    if (existingTheme) {
      throw new BadRequestException(
        `Theme "${slug}" already exists in installed themes. Please rename the theme first.`,
      );
    }

    const themePath = path.join(this.themesDir, slug);

    try {
      // Create theme directory structure
      await fs.mkdir(themePath, { recursive: true });
      await fs.mkdir(path.join(themePath, 'templates'), { recursive: true });
      await fs.mkdir(path.join(themePath, 'assets'), { recursive: true });
      await fs.mkdir(path.join(themePath, 'assets', 'css'), { recursive: true });

      // Generate theme.json
      const themeJson = {
        name: theme.name,
        version: '1.0.0',
        author: 'Theme Designer',
        description: theme.description || `Custom theme created with Theme Designer`,
        thumbnail: `/themes/${slug}/screenshot.png`,
        designConfig: settings,
      };
      await fs.writeFile(path.join(themePath, 'theme.json'), JSON.stringify(themeJson, null, 2));

      // Generate CSS
      const cssContent = this.generateCSS(settings, theme.customCSS || undefined);
      await fs.writeFile(path.join(themePath, 'assets', 'css', 'style.css'), cssContent);

      // Generate templates from pages/blocks
      const pages = (theme.pages as unknown as ThemePageData[]) || [];
      const templates = this.generateTemplates(theme.name, settings, slug, pages);
      for (const [name, content] of Object.entries(templates)) {
        await fs.writeFile(path.join(themePath, 'templates', `${name}.hbs`), content);
      }

      // Generate screenshot placeholder
      await this.generateScreenshot(themePath, settings);

      // Register theme in database
      const installedTheme = await this.prisma.theme.create({
        data: {
          name: theme.name,
          slug,
          version: '1.0.0',
          author: 'Theme Designer',
          description: theme.description || `Custom theme created with Theme Designer`,
          thumbnail: `/themes/${slug}/screenshot.png`,
          path: `/themes/${slug}`,
          config: JSON.parse(JSON.stringify(themeJson)),
        },
      });

      return installedTheme;
    } catch (error) {
      // Clean up on failure
      try {
        await fs.rm(themePath, { recursive: true, force: true });
      } catch {}

      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error installing theme:', error);
      throw new BadRequestException('Failed to install theme: ' + error.message);
    }
  }

  /**
   * Export theme as ZIP file
   */
  async exportAsZip(id: string): Promise<Buffer> {
    const theme = await this.findById(id);
    const settings = theme.settings as unknown as CustomThemeSettings;

    const slug = theme.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const zip = new AdmZip();

    // Generate theme.json
    const themeJson = {
      name: theme.name,
      version: '1.0.0',
      author: 'Theme Designer',
      description: theme.description || `Custom theme created with Theme Designer`,
      thumbnail: `/themes/${slug}/screenshot.png`,
      designConfig: settings,
    };
    zip.addFile(`${slug}/theme.json`, Buffer.from(JSON.stringify(themeJson, null, 2)));

    // Generate CSS
    const cssContent = this.generateCSS(settings, theme.customCSS || undefined);
    zip.addFile(`${slug}/assets/css/style.css`, Buffer.from(cssContent));

    // Generate templates from pages/blocks
    const pages = (theme.pages as unknown as ThemePageData[]) || [];
    const templates = this.generateTemplates(theme.name, settings, slug, pages);
    for (const [name, content] of Object.entries(templates)) {
      zip.addFile(`${slug}/templates/${name}.hbs`, Buffer.from(content));
    }

    // Generate SVG screenshot
    const screenshotSvg = this.generateScreenshotSVG(settings);
    zip.addFile(`${slug}/screenshot.svg`, Buffer.from(screenshotSvg));

    return zip.toBuffer();
  }

  /**
   * Convert content blocks to HTML
   */
  private renderBlockToHTML(block: ContentBlockData, settings: CustomThemeSettings): string {
    const { type, props } = block;

    switch (type) {
      case 'hero':
        return `<section class="hero-block" style="background: ${props.backgroundImage ? `linear-gradient(rgba(0,0,0,${props.overlay || 0.5}), rgba(0,0,0,${props.overlay || 0.5})), url('${props.backgroundImage}')` : `linear-gradient(135deg, ${settings.colors.primary}, ${settings.colors.secondary})`}; background-size: cover; background-position: center; padding: 6rem 0; text-align: ${props.alignment || 'center'}; color: #fff;">
  <div class="container">
    <h1 style="font-size: 3rem; margin-bottom: 1rem; color: #fff;">${props.title || 'Welcome'}</h1>
    <p style="font-size: 1.25rem; max-width: 600px; ${props.alignment === 'center' ? 'margin: 0 auto 2rem;' : 'margin-bottom: 2rem;'}">${props.subtitle || ''}</p>
    ${props.ctaText ? `<a href="${props.ctaUrl || '#'}" class="btn btn-primary" style="background: #fff; color: ${settings.colors.primary};">${props.ctaText}</a>` : ''}
  </div>
</section>`;

      case 'features':
        const featuresHTML = (props.features || []).map((f: any) => `
      <div class="feature-item" style="text-align: center; padding: 2rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">${f.icon || '⭐'}</div>
        <h3 style="margin-bottom: 0.5rem;">${f.title || 'Feature'}</h3>
        <p style="color: var(--color-text-muted);">${f.description || ''}</p>
      </div>`).join('');
        return `<section class="features-block" style="padding: var(--section-padding) 0;">
  <div class="container">
    ${props.title ? `<h2 style="text-align: center; margin-bottom: 3rem;">${props.title}</h2>` : ''}
    <div style="display: grid; grid-template-columns: repeat(${props.columns || 3}, 1fr); gap: 2rem;">
      ${featuresHTML}
    </div>
  </div>
</section>`;

      case 'cta':
        return `<section class="cta-block" style="padding: var(--section-padding) 0; background: ${props.style === 'gradient' ? `linear-gradient(135deg, ${settings.colors.primary}, ${settings.colors.secondary})` : 'var(--color-surface)'}; text-align: center; ${props.style === 'gradient' ? 'color: #fff;' : ''}">
  <div class="container">
    <h2 style="margin-bottom: 1rem; ${props.style === 'gradient' ? 'color: #fff;' : ''}">${props.title || 'Get Started'}</h2>
    <p style="margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto;">${props.description || ''}</p>
    <a href="${props.buttonLink || '#'}" class="btn btn-primary" ${props.style === 'gradient' ? 'style="background: #fff; color: ' + settings.colors.primary + ';"' : ''}>${props.buttonText || 'Learn More'}</a>
  </div>
</section>`;

      case 'testimonial':
        return `<section class="testimonial-block" style="padding: var(--section-padding) 0; background: var(--color-surface);">
  <div class="container" style="max-width: 800px;">
    <blockquote style="font-size: 1.5rem; font-style: italic; text-align: center; margin-bottom: 2rem; color: var(--color-heading);">"${props.quote || ''}"</blockquote>
    <div style="display: flex; align-items: center; justify-content: center; gap: 1rem;">
      ${props.avatar ? `<img src="${props.avatar}" alt="${props.author}" style="width: 60px; height: 60px; border-radius: 50%; object-fit: cover;">` : ''}
      <div>
        <div style="font-weight: 600;">${props.author || 'Customer'}</div>
        <div style="color: var(--color-text-muted); font-size: 0.9rem;">${props.role || ''}</div>
      </div>
    </div>
  </div>
</section>`;

      case 'stats':
        const statsHTML = (props.stats || []).map((s: any) => `
      <div style="text-align: center; padding: 1.5rem;">
        <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-primary);">${s.value || '0'}</div>
        <div style="color: var(--color-text-muted);">${s.label || ''}</div>
      </div>`).join('');
        return `<section class="stats-block" style="padding: var(--section-padding) 0; background: var(--color-surface);">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(${(props.stats || []).length || 4}, 1fr); gap: 2rem;">
      ${statsHTML}
    </div>
  </div>
</section>`;

      case 'imageText':
        const imgPos = props.imagePosition || 'left';
        return `<section class="image-text-block" style="padding: var(--section-padding) 0;">
  <div class="container">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4rem; align-items: center;">
      ${imgPos === 'left' ? `<img src="${props.imageUrl || ''}" alt="" style="width: 100%; border-radius: var(--border-radius);">` : ''}
      <div>
        <h2 style="margin-bottom: 1rem;">${props.title || ''}</h2>
        <p style="color: var(--color-text-muted);">${props.text || ''}</p>
      </div>
      ${imgPos === 'right' ? `<img src="${props.imageUrl || ''}" alt="" style="width: 100%; border-radius: var(--border-radius);">` : ''}
    </div>
  </div>
</section>`;

      case 'gallery':
        const images = (props.images || []).map((img: any) => `
      <div style="overflow: hidden; border-radius: var(--border-radius);">
        <img src="${img.src || ''}" alt="${img.caption || ''}" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; transition: transform 0.3s;">
      </div>`).join('');
        return `<section class="gallery-block" style="padding: var(--section-padding) 0;">
  <div class="container">
    <div style="display: grid; grid-template-columns: repeat(${props.columns || 3}, 1fr); gap: 1rem;">
      ${images}
    </div>
  </div>
</section>`;

      case 'button':
        return `<div style="text-align: center; padding: 1rem 0;">
  <a href="${props.url || '#'}" class="btn btn-${props.style === 'outline' ? 'outline' : 'primary'}">${props.text || 'Button'}</a>
</div>`;

      case 'divider':
        return `<hr style="border: none; height: 1px; background: var(--color-border); margin: var(--section-padding) auto; max-width: ${props.width || '100%'};">`;

      case 'pricing':
        const plans = (props.plans || []).map((plan: any) => `
      <div class="card" style="padding: 2rem; text-align: center; ${plan.featured ? 'border-color: var(--color-primary); transform: scale(1.05);' : ''}">
        <h3 style="margin-bottom: 0.5rem;">${plan.name || 'Plan'}</h3>
        <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-primary); margin-bottom: 1rem;">$${plan.price || '0'}<span style="font-size: 1rem; font-weight: normal; color: var(--color-text-muted);">/${plan.period || 'mo'}</span></div>
        <ul style="list-style: none; padding: 0; margin-bottom: 2rem; text-align: left;">
          ${(plan.features || []).map((f: string) => `<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--color-border);">✓ ${f}</li>`).join('')}
        </ul>
        <a href="${plan.buttonLink || '#'}" class="btn btn-${plan.featured ? 'primary' : 'outline'}">${plan.buttonText || 'Choose Plan'}</a>
      </div>`).join('');
        return `<section class="pricing-block" style="padding: var(--section-padding) 0;">
  <div class="container">
    ${props.title ? `<h2 style="text-align: center; margin-bottom: 3rem;">${props.title}</h2>` : ''}
    <div style="display: grid; grid-template-columns: repeat(${(props.plans || []).length || 3}, 1fr); gap: 2rem; align-items: center;">
      ${plans}
    </div>
  </div>
</section>`;

      case 'newsletter':
        return `<section class="newsletter-block" style="padding: var(--section-padding) 0; background: var(--color-primary); color: #fff; text-align: center;">
  <div class="container" style="max-width: 600px;">
    <h2 style="color: #fff; margin-bottom: 0.5rem;">${props.title || 'Subscribe to Our Newsletter'}</h2>
    <p style="margin-bottom: 2rem; opacity: 0.9;">${props.description || 'Stay updated with our latest news'}</p>
    <form style="display: flex; gap: 1rem;">
      <input type="email" placeholder="${props.placeholder || 'Enter your email'}" style="flex: 1; padding: 1rem; border: none; border-radius: var(--border-radius);">
      <button type="submit" class="btn" style="background: #fff; color: var(--color-primary);">${props.buttonText || 'Subscribe'}</button>
    </form>
  </div>
</section>`;

      case 'card':
        return `<div class="card" style="padding: 2rem;">
  ${props.image ? `<img src="${props.image}" alt="" style="width: 100%; border-radius: var(--border-radius); margin-bottom: 1rem;">` : ''}
  <h3>${props.title || 'Card Title'}</h3>
  <p style="color: var(--color-text-muted);">${props.description || ''}</p>
  ${props.buttonText ? `<a href="${props.buttonLink || '#'}" class="btn btn-primary" style="margin-top: 1rem;">${props.buttonText}</a>` : ''}
</div>`;

      case 'productGrid':
        return `<section class="product-grid-block" style="padding: var(--section-padding) 0;">
  <div class="container">
    <h2 style="text-align: center; margin-bottom: 2rem;">Featured Products</h2>
    <div class="posts-grid">
      {{#each featuredProducts}}
      <article class="post-card">
        {{#if images.[0]}}<img src="{{images.[0]}}" alt="{{name}}" class="post-image">{{/if}}
        <div class="post-content">
          <h3><a href="/shop/product/{{slug}}">{{name}}</a></h3>
          <p style="color: var(--color-primary); font-weight: 600;">{{#if salePrice}}<s style="color: var(--color-text-muted);">$\\{{price}}</s> $\\{{salePrice}}{{else}}$\\{{price}}{{/if}}</p>
          <a href="/shop/product/{{slug}}" class="btn btn-sm btn-primary">View Product</a>
        </div>
      </article>
      {{/each}}
    </div>
  </div>
</section>`;

      case 'courseGrid':
        return `<section class="course-grid-block" style="padding: var(--section-padding) 0;">
  <div class="container">
    <h2 style="text-align: center; margin-bottom: 2rem;">Featured Courses</h2>
    <div class="posts-grid">
      {{#each featuredCourses}}
      <article class="post-card">
        {{#if thumbnail}}<img src="{{thumbnail}}" alt="{{title}}" class="post-image">{{/if}}
        <div class="post-content">
          <h3><a href="/courses/{{slug}}">{{title}}</a></h3>
          <p>{{shortDescription}}</p>
          <a href="/courses/{{slug}}" class="btn btn-sm btn-primary">Learn More</a>
        </div>
      </article>
      {{/each}}
    </div>
  </div>
</section>`;

      default:
        // For unknown blocks, render as placeholder
        return `<!-- Block: ${type} -->`;
    }
  }

  /**
   * Render all blocks from a page to HTML
   */
  private renderPageBlocks(blocks: ContentBlockData[], settings: CustomThemeSettings): string {
    if (!blocks || blocks.length === 0) {
      return '';
    }
    return blocks.map(block => this.renderBlockToHTML(block, settings)).join('\n\n');
  }

  /**
   * Generate Handlebars templates for the theme
   */
  private generateTemplates(themeName: string, settings: CustomThemeSettings, slug: string, pages: ThemePageData[] = []): Record<string, string> {
    const { typography } = settings;

    const header = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{#if post}}{{post.title}} - {{/if}}{{#if page}}{{page.title}} - {{/if}}{{site.name}}</title>
  <meta name="description" content="{{#if post}}{{post.excerpt}}{{else}}{{site.description}}{{/if}}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${typography.headingFont.replace(/ /g, '+')}:wght@400;500;600;700&family=${typography.bodyFont.replace(/ /g, '+')}:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/themes/${slug}/assets/css/style.css">
</head>
<body>
  <nav class="navbar">
    <div class="container">
      <div class="nav-wrapper">
        <a href="/" class="logo">{{site.name}}</a>
        <div class="nav-menu">
          {{#if menus.header}}
            {{#each menus.header.items}}
              <a href="{{this.url}}" class="nav-link" target="{{this.target}}">{{this.label}}</a>
            {{/each}}
          {{else}}
            <a href="/" class="nav-link">Home</a>
            <a href="/shop" class="nav-link">Shop</a>
            <a href="/courses" class="nav-link">Courses</a>
            <a href="/blog" class="nav-link">Blog</a>
          {{/if}}
        </div>
      </div>
    </div>
  </nav>
  <main class="main-content">
`;

    const footer = `  </main>
  <footer class="site-footer">
    <div class="container">
      <p>&copy; {{year}} {{site.name}}. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>
`;

    // Find home page and render its blocks
    const homePage = pages.find(p => p.isHomePage || p.slug === '/');
    const homePageBlocks = homePage?.blocks || [];
    const renderedHomeBlocks = this.renderPageBlocks(homePageBlocks, settings);

    // If no blocks, use default layout
    const home = renderedHomeBlocks
      ? `{{> header}}
${renderedHomeBlocks}

<!-- Dynamic content sections -->
{{#if featuredProducts.length}}
<section class="posts-section">
  <div class="container">
    <h2>Featured Products</h2>
    <div class="posts-grid">
      {{#each featuredProducts}}
      <article class="post-card">
        {{#if images.[0]}}<img src="{{images.[0]}}" alt="{{name}}" class="post-image">{{/if}}
        <div class="post-content">
          <h3><a href="/shop/product/{{slug}}">{{name}}</a></h3>
          <p style="color: var(--color-primary); font-weight: 600;">\{{#if salePrice}}<s style="color: var(--color-text-muted);">$\{{price}}</s> $\{{salePrice}}\{{else}}$\{{price}}\{{/if}}</p>
        </div>
      </article>
      {{/each}}
    </div>
  </div>
</section>
{{/if}}

<section class="posts-section">
  <div class="container">
    <h2>Latest Posts</h2>
    <div class="posts-grid">
      {{#each posts}}
      <article class="post-card">
        {{#if this.featuredImage}}<img src="{{this.featuredImage}}" alt="{{this.title}}" class="post-image">{{/if}}
        <div class="post-content">
          <h3><a href="/post/{{this.slug}}">{{this.title}}</a></h3>
          <p>{{this.excerpt}}</p>
        </div>
      </article>
      {{/each}}
    </div>
  </div>
</section>
{{> footer}}`
      : `{{> header}}
<section class="hero">
  <div class="container">
    <h1>Welcome to {{site.name}}</h1>
    <p>{{site.description}}</p>
    <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
      <a href="/shop" class="btn btn-primary">Browse Shop</a>
      <a href="/courses" class="btn btn-outline">View Courses</a>
    </div>
  </div>
</section>

{{#if featuredProducts.length}}
<section class="posts-section">
  <div class="container">
    <h2>Featured Products</h2>
    <div class="posts-grid">
      {{#each featuredProducts}}
      <article class="post-card">
        {{#if images.[0]}}<img src="{{images.[0]}}" alt="{{name}}" class="post-image">{{/if}}
        <div class="post-content">
          <h3><a href="/shop/product/{{slug}}">{{name}}</a></h3>
          <p style="color: var(--color-primary); font-weight: 600;">\{{#if salePrice}}<s style="color: var(--color-text-muted);">$\{{price}}</s> $\{{salePrice}}\{{else}}$\{{price}}\{{/if}}</p>
        </div>
      </article>
      {{/each}}
    </div>
  </div>
</section>
{{/if}}

<section class="posts-section">
  <div class="container">
    <h2>Latest Posts</h2>
    <div class="posts-grid">
      {{#each posts}}
      <article class="post-card">
        {{#if this.featuredImage}}<img src="{{this.featuredImage}}" alt="{{this.title}}" class="post-image">{{/if}}
        <div class="post-content">
          <h3><a href="/post/{{this.slug}}">{{this.title}}</a></h3>
          <p>{{this.excerpt}}</p>
        </div>
      </article>
      {{/each}}
    </div>
  </div>
</section>
{{> footer}}`;

    // Use correct template names: single-post, single-page
    const singlePost = `{{> header}}
<article class="single-post">
  <div class="container">
    {{#if post.featuredImage}}
    <img src="{{post.featuredImage}}" alt="{{post.title}}" class="featured-image">
    {{/if}}
    <h1>{{post.title}}</h1>
    <div class="post-meta">
      {{#if post.author}}<span>By {{post.author.name}}</span> &bull; {{/if}}
      <span>{{formatDate post.createdAt}}</span>
      {{#if post.category}} &bull; <a href="/category/{{post.category.slug}}">{{post.category.name}}</a>{{/if}}
    </div>
    <div class="post-body">
      {{{post.content}}}
    </div>
  </div>
</article>
{{> footer}}
`;

    const singlePage = `{{> header}}
<div class="page-content">
  <div class="container">
    <h1>{{page.title}}</h1>
    <div class="post-body">
      {{{page.content}}}
    </div>
  </div>
</div>
{{> footer}}
`;

    const archive = `{{> header}}
<section class="posts-section">
  <div class="container">
    <h1>Blog</h1>
    <div class="posts-grid">
      {{#each posts}}
      <article class="post-card">
        {{#if this.featuredImage}}
        <img src="{{this.featuredImage}}" alt="{{this.title}}" class="post-image">
        {{/if}}
        <div class="post-content">
          <h3><a href="/post/{{this.slug}}">{{this.title}}</a></h3>
          <p>{{this.excerpt}}</p>
        </div>
      </article>
      {{/each}}
    </div>
  </div>
</section>
{{> footer}}
`;

    const shop = `{{> header}}
<section class="posts-section">
  <div class="container">
    <h1>Shop</h1>
    <div class="posts-grid">
      {{#each products}}
      <article class="post-card">
        {{#if images.[0]}}
        <img src="{{images.[0]}}" alt="{{name}}" class="post-image">
        {{/if}}
        <div class="post-content">
          <h3><a href="/shop/product/{{slug}}">{{name}}</a></h3>
          <p style="color: var(--color-primary); font-weight: 600;">
            {{#if salePrice}}<s style="color: var(--color-text-muted);">\${{price}}</s> \${{salePrice}}{{else}}\${{price}}{{/if}}
          </p>
          <a href="/shop/product/{{slug}}" class="btn btn-sm btn-primary">View Product</a>
        </div>
      </article>
      {{/each}}
    </div>
  </div>
</section>
{{> footer}}
`;

    const singleProduct = `{{> header}}
<div class="page-content">
  <div class="container">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
      <div>
        {{#if product.images.[0]}}
        <img src="{{product.images.[0]}}" alt="{{product.name}}" style="width: 100%; border-radius: var(--border-radius);">
        {{/if}}
      </div>
      <div>
        <h1>{{product.name}}</h1>
        <p style="font-size: 1.5rem; color: var(--color-primary); font-weight: 600; margin-bottom: 1rem;">
          {{#if product.salePrice}}<s style="color: var(--color-text-muted);">\${{product.price}}</s> \${{product.salePrice}}{{else}}\${{product.price}}{{/if}}
        </p>
        <div class="post-body">{{{product.description}}}</div>
        <button class="btn btn-primary" style="margin-top: 1rem;">Add to Cart</button>
      </div>
    </div>
  </div>
</div>
{{> footer}}
`;

    const courses = `{{> header}}
<section class="posts-section">
  <div class="container">
    <h1>Courses</h1>
    <div class="posts-grid">
      {{#each courses}}
      <article class="post-card">
        {{#if thumbnail}}
        <img src="{{thumbnail}}" alt="{{title}}" class="post-image">
        {{/if}}
        <div class="post-content">
          <h3><a href="/courses/{{slug}}">{{title}}</a></h3>
          <p>{{shortDescription}}</p>
          <p style="color: var(--color-primary); font-weight: 600;">
            {{#if (eq priceType 'FREE')}}Free{{else}}\${{price}}{{/if}}
          </p>
          <a href="/courses/{{slug}}" class="btn btn-sm btn-primary">Learn More</a>
        </div>
      </article>
      {{/each}}
    </div>
  </div>
</section>
{{> footer}}
`;

    const singleCourse = `{{> header}}
<div class="page-content">
  <div class="container">
    {{#if course.thumbnail}}
    <img src="{{course.thumbnail}}" alt="{{course.title}}" class="featured-image">
    {{/if}}
    <h1>{{course.title}}</h1>
    <div class="post-meta">
      <span>Level: {{course.level}}</span>
      {{#if course.estimatedHours}} &bull; <span>{{course.estimatedHours}} hours</span>{{/if}}
    </div>
    <div class="post-body">
      {{{course.description}}}
    </div>
    <div style="margin-top: 2rem;">
      <p style="font-size: 1.5rem; color: var(--color-primary); font-weight: 600;">
        {{#if (eq course.priceType 'FREE')}}Free{{else}}\${{course.price}}{{/if}}
      </p>
      <button class="btn btn-primary btn-lg" style="margin-top: 1rem;">Enroll Now</button>
    </div>
  </div>
</div>
{{> footer}}
`;

    return {
      header,
      footer,
      home,
      'single-post': singlePost,
      'single-page': singlePage,
      archive,
      shop,
      'single-product': singleProduct,
      courses,
      'single-course': singleCourse
    };
  }

  /**
   * Generate screenshot placeholder
   */
  private async generateScreenshot(themePath: string, settings: CustomThemeSettings) {
    const svg = this.generateScreenshotSVG(settings);
    await fs.writeFile(path.join(themePath, 'screenshot.svg'), svg);
    // Also create a simple PNG placeholder message
    await fs.writeFile(path.join(themePath, 'screenshot.png'), Buffer.from(''));
  }

  /**
   * Generate SVG screenshot
   */
  private generateScreenshotSVG(settings: CustomThemeSettings): string {
    const { colors } = settings;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect width="1200" height="900" fill="${colors.background}"/>
  <rect y="0" width="1200" height="60" fill="${colors.surface}"/>
  <text x="30" y="40" font-family="system-ui" font-size="24" font-weight="bold" fill="${colors.primary}">Theme Preview</text>
  <rect x="100" y="150" width="1000" height="400" rx="8" fill="${colors.surface}" stroke="${colors.border}"/>
  <text x="600" y="350" text-anchor="middle" font-family="system-ui" font-size="48" font-weight="bold" fill="${colors.heading}">Custom Theme</text>
  <text x="600" y="420" text-anchor="middle" font-family="system-ui" font-size="24" fill="${colors.textMuted}">Created with Theme Designer</text>
  <rect x="500" y="480" width="200" height="50" rx="8" fill="${colors.primary}"/>
  <text x="600" y="512" text-anchor="middle" font-family="system-ui" font-size="18" fill="#ffffff">Get Started</text>
</svg>`;
  }
}
