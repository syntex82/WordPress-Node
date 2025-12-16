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
import { CreateCustomThemeDto } from './dto/create-custom-theme.dto';
import { UpdateCustomThemeDto } from './dto/update-custom-theme.dto';
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

// DTOs are now imported from separate files with proper validation decorators

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
        pages: theme.pages as any, // Include pages with blocks
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
      pages: theme.pages, // Include pages with blocks
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
        pages: data.pages, // Include pages with blocks if provided
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
.nav-menu { display: flex; gap: 1.5rem; align-items: center; flex: 1; justify-content: center; }
.nav-link { font-weight: 500; color: var(--color-text); padding: 0.5rem 1rem; border-radius: var(--border-radius); }
.nav-link:hover { background: var(--color-primary); color: #fff; }

/* Nav Actions */
.nav-actions { display: flex; align-items: center; gap: 1rem; }
.nav-icon { display: flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; color: var(--color-text); transition: var(--transition); position: relative; }
.nav-icon:hover { background: var(--color-background); color: var(--color-primary); }
.cart-count { position: absolute; top: -2px; right: -2px; background: var(--color-primary); color: #fff; font-size: 0.7rem; font-weight: 600; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; padding: 0 4px; }
.nav-auth-link { margin-left: 0.5rem; }
.user-menu { position: relative; }
.user-menu-btn { display: flex; align-items: center; gap: 0.5rem; background: none; border: none; cursor: pointer; padding: 0.25rem; border-radius: var(--border-radius); transition: var(--transition); }
.user-menu-btn:hover { background: var(--color-background); }
.user-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--color-primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.9rem; text-transform: uppercase; }
.user-name { color: var(--color-text); font-weight: 500; font-size: 0.9rem; }
.user-dropdown { position: absolute; top: calc(100% + 8px); right: 0; background: var(--color-surface); border: var(--border-width) solid var(--color-border); border-radius: calc(var(--border-radius) / 2); min-width: 180px; box-shadow: var(--shadow-lg); opacity: 0; visibility: hidden; transform: translateY(-10px); transition: var(--transition); z-index: 1001; }
.user-dropdown.active { opacity: 1; visibility: visible; transform: translateY(0); }
.dropdown-item { display: block; width: 100%; padding: 0.75rem 1rem; text-align: left; background: none; border: none; color: var(--color-text); font-size: 0.9rem; cursor: pointer; transition: var(--transition); }
.dropdown-item:hover { background: var(--color-background); color: var(--color-primary); }
.dropdown-divider { height: 1px; background: var(--color-border); margin: 0.5rem 0; }

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
      await fs.mkdir(path.join(themePath, 'assets', 'js'), { recursive: true });

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

      // Generate JavaScript files
      const jsFiles = this.generateJavaScriptFiles();
      for (const [name, content] of Object.entries(jsFiles)) {
        await fs.writeFile(path.join(themePath, 'assets', 'js', `${name}.js`), content);
      }

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
   * Export theme as ZIP file - creates a valid theme package that can be imported
   */
  async exportAsZip(id: string): Promise<Buffer> {
    const theme = await this.findById(id);
    const settings = theme.settings as unknown as CustomThemeSettings;

    const slug = theme.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const zip = new AdmZip();

    // Generate templates from pages/blocks FIRST so we know what templates exist
    const pages = (theme.pages as unknown as ThemePageData[]) || [];
    const templates = this.generateTemplates(theme.name, settings, slug, pages);
    const templateNames = Object.keys(templates).map((name) => `${name}.hbs`);

    // Generate theme.json with all required fields for import validation
    const themeJson = {
      name: theme.name,
      version: '1.0.0',
      author: 'Theme Designer',
      description: theme.description || `Custom theme created with Theme Designer`,
      thumbnail: `/themes/${slug}/screenshot.png`,
      templates: templateNames,
      supports: {
        widgets: true,
        menus: true,
        customHeader: true,
        customBackground: true,
        postThumbnails: true,
        responsiveEmbeds: true,
      },
      colors: {
        primary: settings.colors.primary,
        secondary: settings.colors.secondary,
        accent: settings.colors.accent,
        background: settings.colors.background,
        text: settings.colors.text,
      },
      fonts: {
        heading: settings.typography.headingFont,
        body: settings.typography.bodyFont,
      },
      // Store full design config for future editing
      designConfig: settings,
      // Store pages/blocks for re-import into Theme Designer
      pages: pages,
    };
    zip.addFile(`${slug}/theme.json`, Buffer.from(JSON.stringify(themeJson, null, 2)));

    // Generate CSS
    const cssContent = this.generateCSS(settings, theme.customCSS || undefined);
    zip.addFile(`${slug}/assets/css/style.css`, Buffer.from(cssContent));

    // Generate JavaScript files
    const jsFiles = this.generateJavaScriptFiles();
    for (const [name, content] of Object.entries(jsFiles)) {
      zip.addFile(`${slug}/assets/js/${name}.js`, Buffer.from(content));
    }

    // Add templates to ZIP
    for (const [name, content] of Object.entries(templates)) {
      zip.addFile(`${slug}/templates/${name}.hbs`, Buffer.from(content));
    }

    // Generate PNG screenshot placeholder (1x1 transparent pixel as placeholder)
    // The import expects PNG format
    const pngPlaceholder = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    zip.addFile(`${slug}/screenshot.png`, pngPlaceholder);

    // Also add SVG screenshot for better quality preview
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
        const featuresHTML = (props.features || [])
          .map(
            (f: any) => `
      <div class="feature-item" style="text-align: center; padding: 2rem;">
        <div style="font-size: 2.5rem; margin-bottom: 1rem;">${f.icon || '⭐'}</div>
        <h3 style="margin-bottom: 0.5rem;">${f.title || 'Feature'}</h3>
        <p style="color: var(--color-text-muted);">${f.description || ''}</p>
      </div>`,
          )
          .join('');
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
        const statsHTML = (props.stats || [])
          .map(
            (s: any) => `
      <div style="text-align: center; padding: 1.5rem;">
        <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-primary);">${s.value || '0'}</div>
        <div style="color: var(--color-text-muted);">${s.label || ''}</div>
      </div>`,
          )
          .join('');
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
        const images = (props.images || [])
          .map(
            (img: any) => `
      <div style="overflow: hidden; border-radius: var(--border-radius);">
        <img src="${img.src || ''}" alt="${img.caption || ''}" style="width: 100%; aspect-ratio: 4/3; object-fit: cover; transition: transform 0.3s;">
      </div>`,
          )
          .join('');
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
        const plans = (props.plans || [])
          .map(
            (plan: any) => `
      <div class="card" style="padding: 2rem; text-align: center; ${plan.featured ? 'border-color: var(--color-primary); transform: scale(1.05);' : ''}">
        <h3 style="margin-bottom: 0.5rem;">${plan.name || 'Plan'}</h3>
        <div style="font-size: 2.5rem; font-weight: 700; color: var(--color-primary); margin-bottom: 1rem;">$${plan.price || '0'}<span style="font-size: 1rem; font-weight: normal; color: var(--color-text-muted);">/${plan.period || 'mo'}</span></div>
        <ul style="list-style: none; padding: 0; margin-bottom: 2rem; text-align: left;">
          ${(plan.features || []).map((f: string) => `<li style="padding: 0.5rem 0; border-bottom: 1px solid var(--color-border);">✓ ${f}</li>`).join('')}
        </ul>
        <a href="${plan.buttonLink || '#'}" class="btn btn-${plan.featured ? 'primary' : 'outline'}">${plan.buttonText || 'Choose Plan'}</a>
      </div>`,
          )
          .join('');
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

      case 'audio':
        return `<div class="audio-block" style="padding: 2rem; background: var(--color-surface); border-radius: var(--border-radius);">
  <div style="display: flex; align-items: center; gap: 1rem;">
    ${props.albumArt ? `<img src="${props.albumArt}" alt="${props.title || ''}" style="width: 80px; height: 80px; border-radius: 8px; object-fit: cover;">` : ''}
    <div>
      <h4 style="margin: 0 0 0.25rem;">${props.title || 'Audio Track'}</h4>
      <p style="margin: 0; color: var(--color-text-muted); font-size: 0.9rem;">${props.artist || ''}</p>
    </div>
  </div>
  ${props.audioUrl ? `<audio controls style="width: 100%; margin-top: 1rem;"><source src="${props.audioUrl}" type="audio/mpeg"></audio>` : ''}
</div>`;

      case 'video':
        return `<div class="video-block" style="padding: var(--section-padding) 0;">
  <div class="container">
    ${props.title ? `<h3 style="text-align: center; margin-bottom: 1rem;">${props.title}</h3>` : ''}
    <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: var(--border-radius);">
      ${props.videoUrl ? `<iframe src="${props.videoUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none;" allowfullscreen></iframe>` : `<img src="${props.posterUrl || ''}" alt="" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;">`}
    </div>
  </div>
</div>`;

      case 'timeline':
        const timelineItems = (props.items || [])
          .map(
            (item: any, i: number) => `
      <div style="display: flex; gap: 1.5rem; margin-bottom: 2rem;">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="width: 12px; height: 12px; border-radius: 50%; background: var(--color-primary);"></div>
          ${i < (props.items || []).length - 1 ? '<div style="flex: 1; width: 2px; background: var(--color-border);"></div>' : ''}
        </div>
        <div style="flex: 1; padding-bottom: 1rem;">
          <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">${item.date || ''}</div>
          <h4 style="margin: 0 0 0.5rem;">${item.title || ''}</h4>
          <p style="margin: 0; color: var(--color-text-muted);">${item.description || ''}</p>
        </div>
      </div>`,
          )
          .join('');
        return `<section class="timeline-block" style="padding: var(--section-padding) 0;">
  <div class="container" style="max-width: 700px;">
    ${props.title ? `<h2 style="text-align: center; margin-bottom: 3rem;">${props.title}</h2>` : ''}
    ${timelineItems}
  </div>
</section>`;

      case 'accordion':
        const accordionItems = (props.items || [])
          .map(
            (item: any, i: number) => `
      <details style="border: 1px solid var(--color-border); border-radius: var(--border-radius); margin-bottom: 0.5rem;" ${i === 0 ? 'open' : ''}>
        <summary style="padding: 1rem; cursor: pointer; font-weight: 600;">${item.title || 'Question'}</summary>
        <div style="padding: 0 1rem 1rem; color: var(--color-text-muted);">${item.content || ''}</div>
      </details>`,
          )
          .join('');
        return `<section class="accordion-block" style="padding: var(--section-padding) 0;">
  <div class="container" style="max-width: 800px;">
    ${props.title ? `<h2 style="text-align: center; margin-bottom: 2rem;">${props.title}</h2>` : ''}
    ${accordionItems}
  </div>
</section>`;

      case 'tabs':
        const tabButtons = (props.tabs || [])
          .map(
            (tab: any, i: number) =>
              `<button style="padding: 0.75rem 1.5rem; border: none; background: ${i === 0 ? 'var(--color-primary)' : 'transparent'}; color: ${i === 0 ? '#fff' : 'var(--color-text)'}; cursor: pointer; border-radius: var(--border-radius) var(--border-radius) 0 0;">${tab.title || 'Tab'}</button>`,
          )
          .join('');
        const tabContent = (props.tabs || [])[0]?.content || '';
        return `<section class="tabs-block" style="padding: var(--section-padding) 0;">
  <div class="container">
    <div style="display: flex; border-bottom: 1px solid var(--color-border);">${tabButtons}</div>
    <div style="padding: 2rem; background: var(--color-surface); border-radius: 0 0 var(--border-radius) var(--border-radius);">${tabContent}</div>
  </div>
</section>`;

      case 'logoCloud':
        const logos = (props.logos || [])
          .map(
            (logo: any) => `
      <div style="display: flex; align-items: center; justify-content: center; padding: 1rem;">
        <img src="${logo.src || ''}" alt="${logo.name || ''}" style="max-height: 50px; max-width: 120px; filter: grayscale(100%); opacity: 0.7; transition: all 0.3s;">
      </div>`,
          )
          .join('');
        return `<section class="logo-cloud-block" style="padding: var(--section-padding) 0; background: var(--color-surface);">
  <div class="container">
    ${props.title ? `<h3 style="text-align: center; margin-bottom: 2rem; color: var(--color-text-muted);">${props.title}</h3>` : ''}
    <div style="display: grid; grid-template-columns: repeat(${props.columns || 5}, 1fr); gap: 2rem; align-items: center;">
      ${logos}
    </div>
  </div>
</section>`;

      case 'socialProof':
        return `<section class="social-proof-block" style="padding: 2rem 0; background: var(--color-surface);">
  <div class="container" style="text-align: center;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2rem; flex-wrap: wrap;">
      ${props.rating ? `<div style="display: flex; align-items: center; gap: 0.5rem;"><span style="font-size: 1.5rem; font-weight: 700;">${props.rating}</span><span style="color: #fbbf24;">★★★★★</span></div>` : ''}
      ${props.reviewCount ? `<div style="color: var(--color-text-muted);">${props.reviewCount} reviews</div>` : ''}
      ${props.text ? `<div>${props.text}</div>` : ''}
    </div>
  </div>
</section>`;

      case 'countdown':
        return `<section class="countdown-block" style="padding: var(--section-padding) 0; background: var(--color-primary); color: #fff; text-align: center;">
  <div class="container">
    ${props.title ? `<h2 style="color: #fff; margin-bottom: 1rem;">${props.title}</h2>` : ''}
    <div style="display: flex; justify-content: center; gap: 2rem;">
      <div><div style="font-size: 3rem; font-weight: 700;">00</div><div style="font-size: 0.9rem; opacity: 0.8;">Days</div></div>
      <div><div style="font-size: 3rem; font-weight: 700;">00</div><div style="font-size: 0.9rem; opacity: 0.8;">Hours</div></div>
      <div><div style="font-size: 3rem; font-weight: 700;">00</div><div style="font-size: 0.9rem; opacity: 0.8;">Minutes</div></div>
      <div><div style="font-size: 3rem; font-weight: 700;">00</div><div style="font-size: 0.9rem; opacity: 0.8;">Seconds</div></div>
    </div>
    ${props.description ? `<p style="margin-top: 1rem; opacity: 0.9;">${props.description}</p>` : ''}
  </div>
</section>`;

      case 'row':
        // Row is a container block - render children if any
        return `<div class="row-block" style="display: flex; gap: 2rem; padding: var(--section-padding) 0;">
  <div class="container" style="display: flex; gap: 2rem; flex-wrap: wrap;">
    <!-- Row content rendered by children -->
  </div>
</div>`;

      case 'header':
        return `<!-- Header block - uses theme header partial -->`;

      case 'featuredProduct':
        return `<section class="featured-product-block" style="padding: var(--section-padding) 0;">
  <div class="container">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center;">
      <img src="${props.product?.image || 'https://picsum.photos/600/400'}" alt="${props.product?.title || ''}" style="width: 100%; border-radius: var(--border-radius);">
      <div>
        ${props.product?.badge ? `<span style="display: inline-block; padding: 0.25rem 0.75rem; background: var(--color-primary); color: #fff; border-radius: 999px; font-size: 0.8rem; margin-bottom: 1rem;">${props.product.badge}</span>` : ''}
        <h2 style="margin-bottom: 0.5rem;">${props.product?.title || 'Featured Product'}</h2>
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          ${props.product?.salePrice ? `<span style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">$${props.product.salePrice}</span><s style="color: var(--color-text-muted);">$${props.product.price}</s>` : `<span style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">$${props.product?.price || '0'}</span>`}
        </div>
        <p style="color: var(--color-text-muted); margin-bottom: 2rem;">${props.product?.description || ''}</p>
        <a href="/shop/product/${props.product?.id || ''}" class="btn btn-primary">View Product</a>
      </div>
    </div>
  </div>
</section>`;

      case 'productCarousel':
        return `<section class="product-carousel-block" style="padding: var(--section-padding) 0;">
  <div class="container">
    <h2 style="text-align: center; margin-bottom: 2rem;">${props.title || 'Featured Products'}</h2>
    <div class="posts-grid">
      {{#each featuredProducts}}
      <article class="post-card">
        {{#if images.[0]}}<img src="{{images.[0]}}" alt="{{name}}" class="post-image">{{/if}}
        <div class="post-content">
          <h3><a href="/shop/product/{{slug}}">{{name}}</a></h3>
          <p style="color: var(--color-primary); font-weight: 600;">\${{price}}</p>
        </div>
      </article>
      {{/each}}
    </div>
  </div>
</section>`;

      case 'courseCard':
        return `<div class="course-card" style="background: var(--color-surface); border-radius: var(--border-radius); overflow: hidden; border: 1px solid var(--color-border);">
  <img src="${props.course?.thumbnail || 'https://picsum.photos/400/200'}" alt="${props.course?.title || ''}" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;">
  <div style="padding: 1.5rem;">
    <h3 style="margin: 0 0 0.5rem;">${props.course?.title || 'Course Title'}</h3>
    <p style="color: var(--color-text-muted); margin-bottom: 1rem;">${props.course?.shortDescription || ''}</p>
    <a href="/courses/${props.course?.slug || ''}" class="btn btn-primary btn-sm">Learn More</a>
  </div>
</div>`;

      case 'loginForm':
        return `<section class="login-form-block" style="padding: var(--section-padding) 0;">
  <div class="container" style="max-width: 400px;">
    <div style="background: var(--color-surface); padding: 2rem; border-radius: var(--border-radius); border: 1px solid var(--color-border);">
      <h2 style="text-align: center; margin-bottom: 1.5rem;">${props.title || 'Sign In'}</h2>
      <form>
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email</label>
          <input type="email" placeholder="Enter your email" style="width: 100%; padding: 0.75rem; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
        </div>
        <div style="margin-bottom: 1.5rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Password</label>
          <input type="password" placeholder="Enter your password" style="width: 100%; padding: 0.75rem; border: 1px solid var(--color-border); border-radius: var(--border-radius);">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%;">Sign In</button>
      </form>
    </div>
  </div>
</section>`;

      case 'saleBanner':
        return `<section class="sale-banner-block" style="padding: 1.5rem 0; background: linear-gradient(135deg, ${settings.colors.primary}, ${settings.colors.secondary}); color: #fff; text-align: center;">
  <div class="container">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2rem; flex-wrap: wrap;">
      <span style="font-size: 1.25rem; font-weight: 700;">${props.text || '🔥 Limited Time Offer!'}</span>
      ${props.buttonText ? `<a href="${props.buttonLink || '#'}" class="btn" style="background: #fff; color: ${settings.colors.primary};">${props.buttonText}</a>` : ''}
    </div>
  </div>
</section>`;

      default:
        // For unknown blocks, render as placeholder comment
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
    return blocks.map((block) => this.renderBlockToHTML(block, settings)).join('\n\n');
  }

  /**
   * Generate Handlebars templates for the theme
   */
  private generateTemplates(
    themeName: string,
    settings: CustomThemeSettings,
    slug: string,
    pages: ThemePageData[] = [],
  ): Record<string, string> {
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
        <div class="nav-actions">
          <a href="/cart" class="nav-icon cart-icon" title="Cart">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
            <span class="cart-count" id="cartCount" style="display: none;">0</span>
          </a>
          {{#if user}}
          <div class="user-menu">
            <button class="user-menu-btn" id="userMenuBtn">
              <span class="user-avatar">{{substring user.name 0 1}}</span>
              <span class="user-name">{{user.name}}</span>
            </button>
            <div class="user-dropdown" id="userDropdown">
              <a href="/my-account" class="dropdown-item">My Account</a>
              <a href="/my-courses" class="dropdown-item">My Courses</a>
              <a href="/orders" class="dropdown-item">Orders</a>
              <div class="dropdown-divider"></div>
              <button class="dropdown-item" id="logoutBtn">Sign Out</button>
            </div>
          </div>
          {{else}}
          <a href="/login" class="nav-link nav-auth-link">Sign In</a>
          <a href="/register" class="btn btn-primary btn-sm">Get Started</a>
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
  <script src="/themes/${slug}/assets/js/main.js"></script>
</body>
</html>
`;

    // Find home page and render its blocks
    const homePage = pages.find((p) => p.isHomePage || p.slug === '/');
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
          <p style="color: var(--color-primary); font-weight: 600;">{{#if salePrice}}<s style="color: var(--color-text-muted);">${'$'}{{price}}</s> ${'$'}{{salePrice}}{{else}}${'$'}{{price}}{{/if}}</p>
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
          <p style="color: var(--color-primary); font-weight: 600;">{{#if salePrice}}<s style="color: var(--color-text-muted);">${'$'}{{price}}</s> ${'$'}{{salePrice}}{{else}}${'$'}{{price}}{{/if}}</p>
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
        <button class="btn btn-primary" data-add-product="{{product.id}}" style="margin-top: 1rem;">Add to Cart</button>
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
        {{#if (eq course.priceType 'FREE')}}Free{{else}}\${{course.priceAmount}}{{/if}}
      </p>
      {{#if (eq course.priceType 'FREE')}}
      <button class="btn btn-primary btn-lg" data-enroll-course="{{course.id}}" style="margin-top: 1rem;">Enroll Now - Free</button>
      {{else}}
      <button class="btn btn-primary btn-lg" data-add-course="{{course.id}}" style="margin-top: 1rem;">Add to Cart</button>
      {{/if}}
    </div>
  </div>
</div>
{{> footer}}
`;

    const login = `{{> header}}
<section class="auth-section" style="display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 200px); padding: var(--section-padding) 0;">
  <div class="container" style="max-width: 420px;">
    <div class="auth-card" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 2.5rem;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="margin-bottom: 0.5rem;">Welcome Back</h1>
        <p style="color: var(--color-text-muted); margin: 0;">Sign in to your account</p>
      </div>
      {{#if error}}<div class="alert alert-error" style="padding: 1rem; background: rgba(239,68,68,0.1); border: 1px solid var(--color-error); color: var(--color-error); border-radius: 8px; margin-bottom: 1.5rem;">{{error}}</div>{{/if}}
      <form id="loginForm" method="POST" action="/login">
        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Email</label>
          <input type="email" name="email" required placeholder="you@example.com" style="width: 100%; padding: 0.75rem 1rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);">
        </div>
        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Password</label>
          <input type="password" name="password" required placeholder="••••••••" style="width: 100%; padding: 0.75rem 1rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;" id="submitBtn"><span class="btn-text">Sign In</span><span class="btn-loading" style="display: none;">Signing in...</span></button>
      </form>
      <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--color-border);">
        <p style="margin: 0; color: var(--color-text-muted);">Don't have an account? <a href="/register">Create one</a></p>
      </div>
    </div>
  </div>
</section>
<script src="/themes/${slug}/assets/js/auth.js"></script>
{{> footer}}
`;

    const register = `{{> header}}
<section class="auth-section" style="display: flex; align-items: center; justify-content: center; min-height: calc(100vh - 200px); padding: var(--section-padding) 0;">
  <div class="container" style="max-width: 420px;">
    <div class="auth-card" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 2.5rem;">
      <div style="text-align: center; margin-bottom: 2rem;">
        <h1 style="margin-bottom: 0.5rem;">Create Account</h1>
        <p style="color: var(--color-text-muted); margin: 0;">Join us and start learning</p>
      </div>
      {{#if error}}<div class="alert alert-error" style="padding: 1rem; background: rgba(239,68,68,0.1); border: 1px solid var(--color-error); color: var(--color-error); border-radius: 8px; margin-bottom: 1.5rem;">{{error}}</div>{{/if}}
      <form id="registerForm" method="POST" action="/register">
        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Full Name</label>
          <input type="text" name="name" required placeholder="John Doe" style="width: 100%; padding: 0.75rem 1rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);">
        </div>
        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Email</label>
          <input type="email" name="email" required placeholder="you@example.com" style="width: 100%; padding: 0.75rem 1rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);">
        </div>
        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Password</label>
          <input type="password" name="password" required placeholder="••••••••" minlength="8" style="width: 100%; padding: 0.75rem 1rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);">
        </div>
        <div style="margin-bottom: 1.25rem;">
          <label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Confirm Password</label>
          <input type="password" name="confirmPassword" required placeholder="••••••••" style="width: 100%; padding: 0.75rem 1rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);">
        </div>
        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;" id="submitBtn"><span class="btn-text">Create Account</span><span class="btn-loading" style="display: none;">Creating...</span></button>
      </form>
      <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--color-border);">
        <p style="margin: 0; color: var(--color-text-muted);">Already have an account? <a href="/login">Sign in</a></p>
      </div>
    </div>
  </div>
</section>
<script src="/themes/${slug}/assets/js/auth.js"></script>
{{> footer}}
`;

    const cart = `{{> header}}
<section class="cart-section" style="padding: var(--section-padding) 0;">
  <div class="container">
    <h1>Shopping Cart</h1>
    <div class="cart-layout" id="cartContent" style="display: grid; grid-template-columns: 1fr 350px; gap: 2rem;">
      <div class="cart-items" id="cartItems" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 1.5rem;">
        <div class="loading-state" style="text-align: center; padding: 2rem; color: var(--color-text-muted);">Loading cart...</div>
      </div>
      <div class="cart-summary" id="cartSummary" style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 1.5rem; height: fit-content;">
        <h3 style="margin-bottom: 1rem;">Order Summary</h3>
        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--color-border);"><span>Subtotal</span><span id="subtotal">$0.00</span></div>
        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid var(--color-border);"><span>Tax</span><span id="tax">$0.00</span></div>
        <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; font-weight: 600; font-size: 1.1rem;"><span>Total</span><span id="total">$0.00</span></div>
        <a href="/checkout" class="btn btn-primary" style="width: 100%; justify-content: center; margin-top: 1rem;">Proceed to Checkout</a>
        <a href="/shop" class="btn btn-outline" style="width: 100%; justify-content: center; margin-top: 0.5rem;">Continue Shopping</a>
      </div>
    </div>
    <div class="empty-cart" id="emptyCart" style="display: none; text-align: center; padding: 4rem 2rem;">
      <div style="font-size: 4rem; margin-bottom: 1rem;">🛒</div>
      <h2>Your cart is empty</h2>
      <p style="color: var(--color-text-muted); margin-bottom: 2rem;">Looks like you haven't added anything yet.</p>
      <div style="display: flex; gap: 1rem; justify-content: center;">
        <a href="/shop" class="btn btn-primary">Browse Products</a>
        <a href="/courses" class="btn btn-outline">Explore Courses</a>
      </div>
    </div>
  </div>
</section>
<script src="/themes/${slug}/assets/js/cart.js"></script>
{{> footer}}
`;

    const checkout = `{{> header}}
<section class="checkout-section" style="padding: var(--section-padding) 0;">
  <div class="container">
    <h1>Checkout</h1>
    <div class="checkout-layout" style="display: grid; grid-template-columns: 1fr 380px; gap: 2rem;">
      <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 2rem;">
        <form id="checkoutForm">
          <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--color-border);">
            <h3 style="margin-bottom: 1rem;">Contact Information</h3>
            {{#if user}}<p style="color: var(--color-text-muted);">Logged in as <strong>{{user.email}}</strong></p>{{else}}
            <div style="margin-bottom: 1rem;"><label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Email</label><input type="email" name="email" required style="width: 100%; padding: 0.75rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);"></div>
            {{/if}}
          </div>
          <div style="margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--color-border);">
            <h3 style="margin-bottom: 1rem;">Billing Address</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div><label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">First Name</label><input type="text" name="firstName" required style="width: 100%; padding: 0.75rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);"></div>
              <div><label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Last Name</label><input type="text" name="lastName" required style="width: 100%; padding: 0.75rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);"></div>
            </div>
            <div style="margin-bottom: 1rem;"><label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Address</label><input type="text" name="address" required style="width: 100%; padding: 0.75rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);"></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
              <div><label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">City</label><input type="text" name="city" required style="width: 100%; padding: 0.75rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);"></div>
              <div><label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">State</label><input type="text" name="state" required style="width: 100%; padding: 0.75rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);"></div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div><label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Postal Code</label><input type="text" name="postalCode" required style="width: 100%; padding: 0.75rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);"></div>
              <div><label style="display: block; font-weight: 500; margin-bottom: 0.5rem;">Country</label><select name="country" required style="width: 100%; padding: 0.75rem; background: var(--color-background); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text);"><option value="">Select</option><option value="US">United States</option><option value="CA">Canada</option><option value="GB">United Kingdom</option></select></div>
            </div>
          </div>
          <button type="submit" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.1rem;" id="placeOrderBtn"><span class="btn-text">Place Order</span><span class="btn-loading" style="display: none;">Processing...</span></button>
        </form>
      </div>
      <div style="background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--border-radius); padding: 1.5rem; height: fit-content;">
        <h3 style="margin-bottom: 1rem;">Order Summary</h3>
        <div id="orderItems" style="margin-bottom: 1rem; max-height: 300px; overflow-y: auto;"><div class="loading-state">Loading...</div></div>
        <div style="border-top: 1px solid var(--color-border); padding-top: 1rem;">
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;"><span>Subtotal</span><span id="subtotal">$0.00</span></div>
          <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;"><span>Tax</span><span id="tax">$0.00</span></div>
          <div style="display: flex; justify-content: space-between; padding: 0.75rem 0; font-weight: 600; font-size: 1.1rem;"><span>Total</span><span id="total">$0.00</span></div>
        </div>
      </div>
    </div>
  </div>
</section>
<script src="/themes/${slug}/assets/js/checkout.js"></script>
{{> footer}}
`;

    // Base templates
    const result: Record<string, string> = {
      header,
      footer,
      home,
      'single-post': singlePost,
      'single-page': singlePage,
      archive,
      shop,
      'single-product': singleProduct,
      courses,
      'single-course': singleCourse,
      login,
      register,
      cart,
      checkout,
    };

    // Generate custom page templates from pages array (non-home pages with blocks)
    for (const page of pages) {
      if (page.isHomePage || page.slug === '/' || !page.blocks || page.blocks.length === 0) {
        continue;
      }
      // Create a template name from the page slug
      const pageName =
        page.slug.replace(/^\//, '').replace(/\//g, '-') ||
        page.name.toLowerCase().replace(/\s+/g, '-');
      const pageBlocks = this.renderPageBlocks(page.blocks, settings);

      result[`page-${pageName}`] = `{{> header}}
${pageBlocks}
{{> footer}}`;
    }

    return result;
  }

  /**
   * Generate JavaScript files for the theme
   */
  private generateJavaScriptFiles(): Record<string, string> {
    const mainJs = `(function(){
  'use strict';
  document.addEventListener('DOMContentLoaded',function(){initUserMenu();updateCartCount();initAddToCart();});
  function initUserMenu(){var b=document.getElementById('userMenuBtn'),d=document.getElementById('userDropdown');if(b&&d){b.addEventListener('click',function(e){e.stopPropagation();d.classList.toggle('active');});document.addEventListener('click',function(){d.classList.remove('active');});}var l=document.getElementById('logoutBtn');if(l){l.addEventListener('click',function(){localStorage.removeItem('access_token');window.location.href='/logout';});}}
  async function updateCartCount(){var c=document.getElementById('cartCount');if(!c)return;try{var r=await fetch('/api/shop/cart',{credentials:'include',headers:getAuthHeaders()});if(!r.ok){c.style.display='none';return;}var cart=await r.json();var count=cart.items?.reduce((s,i)=>s+i.quantity,0)||0;if(count>0){c.textContent=count;c.style.display='flex';}else{c.style.display='none';}}catch(e){c.style.display='none';}}
  function initAddToCart(){document.querySelectorAll('[data-add-product]').forEach(b=>{b.addEventListener('click',async function(){await addToCart('product',this.dataset.addProduct);});});document.querySelectorAll('[data-add-course]').forEach(b=>{b.addEventListener('click',async function(){await addToCart('course',this.dataset.addCourse);});});document.querySelectorAll('[data-enroll-course]').forEach(b=>{b.addEventListener('click',async function(){await enrollFreeCourse(this.dataset.enrollCourse);});});}
  async function addToCart(type,id){try{var endpoint=type==='course'?'/api/shop/cart/add-course':'/api/shop/cart/add';var body=type==='course'?{courseId:id}:{productId:id,quantity:1};var r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',...getAuthHeaders()},body:JSON.stringify(body),credentials:'include'});if(r.ok){updateCartCount();showNotification('Added to cart!','success');}else{var e=await r.json();showNotification(e.message||'Failed to add to cart','error');}}catch(e){showNotification('Failed to add to cart','error');}}
  async function enrollFreeCourse(courseId){try{var r=await fetch('/api/lms/courses/'+courseId+'/enroll',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({}),credentials:'include'});if(r.ok){showNotification('Successfully enrolled!','success');setTimeout(function(){window.location.href='/learn/'+courseId;},1500);}else if(r.status===401){showNotification('Please log in to enroll','error');setTimeout(function(){window.location.href='/login?redirect='+encodeURIComponent(window.location.pathname);},1500);}else{var e=await r.json();showNotification(e.message||'Failed to enroll','error');}}catch(e){showNotification('Failed to enroll','error');}}
  function showNotification(msg,type){var n=document.createElement('div');n.className='notification notification-'+type;n.textContent=msg;n.style.cssText='position:fixed;top:80px;right:20px;padding:1rem 1.5rem;background:'+(type==='success'?'var(--color-success)':type==='error'?'var(--color-error)':'var(--color-primary)')+';color:white;border-radius:8px;z-index:9999;';document.body.appendChild(n);setTimeout(()=>n.remove(),3000);}
  function getAuthHeaders(){var t=localStorage.getItem('access_token');return t?{'Authorization':'Bearer '+t}:{};}
  window.addToCart=addToCart;window.updateCartCount=updateCartCount;window.enrollFreeCourse=enrollFreeCourse;
})();`;

    const authJs = `(function(){
  'use strict';
  var loginForm=document.getElementById('loginForm');
  if(loginForm){loginForm.addEventListener('submit',function(e){var btn=document.getElementById('submitBtn'),txt=btn.querySelector('.btn-text'),load=btn.querySelector('.btn-loading');var email=loginForm.querySelector('[name="email"]').value,pass=loginForm.querySelector('[name="password"]').value;if(!email||!pass){e.preventDefault();showError(loginForm,'Please fill in all fields');return;}txt.style.display='none';load.style.display='inline';btn.disabled=true;});}
  var regForm=document.getElementById('registerForm');
  if(regForm){regForm.addEventListener('submit',function(e){var btn=document.getElementById('submitBtn'),txt=btn.querySelector('.btn-text'),load=btn.querySelector('.btn-loading');var pass=regForm.querySelector('[name="password"]').value,conf=regForm.querySelector('[name="confirmPassword"]').value;if(pass!==conf){e.preventDefault();showError(regForm,'Passwords do not match');return;}txt.style.display='none';load.style.display='inline';btn.disabled=true;});}
  function showError(f,m){var a=f.querySelector('.alert-error');if(!a){a=document.createElement('div');a.className='alert alert-error';f.insertBefore(a,f.firstChild);}a.textContent=m;}
})();`;

    const cartJs = `(function(){
  'use strict';
  var API='/api/shop/cart';
  document.addEventListener('DOMContentLoaded',function(){loadCart();});
  async function loadCart(){var items=document.getElementById('cartItems'),empty=document.getElementById('emptyCart'),content=document.getElementById('cartContent');if(!items)return;try{var r=await fetch(API,{credentials:'include',headers:getAuthHeaders()});if(!r.ok)throw new Error();var cart=await r.json();if(!cart.items||cart.items.length===0){if(content)content.style.display='none';if(empty)empty.style.display='block';return;}if(content)content.style.display='grid';if(empty)empty.style.display='none';renderItems(cart.items);updateSummary(cart);}catch(e){items.innerHTML='<p>Failed to load cart</p>';}}
  function renderItems(items){var el=document.getElementById('cartItems');if(!el)return;el.innerHTML=items.map(i=>{var isCourse=i.type==='COURSE';var img=i.product?.images?.[0]||i.course?.thumbnail||'/placeholder.jpg';var title=i.product?.name||i.course?.title||'Item';var price=i.product?.price||i.course?.price||0;return '<div class="cart-item" data-item-id="'+i.id+'"><img src="'+img+'" alt="'+title+'" style="width:100px;height:100px;object-fit:cover;border-radius:8px;"><div style="flex:1;"><div style="font-weight:600;">'+title+'</div><div style="font-size:0.8rem;color:var(--color-primary);">'+(isCourse?'Course':'Product')+'</div><div style="color:var(--color-text-muted);">$'+parseFloat(price).toFixed(2)+'</div></div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:0.5rem;">'+(isCourse?'':'<div style="display:flex;align-items:center;gap:0.5rem;"><button onclick="updateQuantity(\\''+i.id+'\\','+(i.quantity-1)+')" style="width:32px;height:32px;border:1px solid var(--color-border);background:var(--color-background);border-radius:4px;cursor:pointer;">-</button><span>'+i.quantity+'</span><button onclick="updateQuantity(\\''+i.id+'\\','+(i.quantity+1)+')" style="width:32px;height:32px;border:1px solid var(--color-border);background:var(--color-background);border-radius:4px;cursor:pointer;">+</button></div>')+'<button onclick="removeItem(\\''+i.id+'\\')\" style="background:none;border:none;color:var(--color-error);cursor:pointer;">Remove</button></div></div>';}).join('');}
  function updateSummary(cart){var sub=cart.items.reduce((s,i)=>{var p=i.product?.price||i.course?.price||0;return s+(parseFloat(p)*i.quantity);},0);var tax=sub*0.1;document.getElementById('subtotal').textContent='$'+sub.toFixed(2);document.getElementById('tax').textContent='$'+tax.toFixed(2);document.getElementById('total').textContent='$'+(sub+tax).toFixed(2);}
  window.updateQuantity=async function(id,qty){if(qty<1){removeItem(id);return;}try{await fetch(API+'/item/'+id,{method:'PUT',headers:{'Content-Type':'application/json',...getAuthHeaders()},body:JSON.stringify({quantity:qty}),credentials:'include'});loadCart();if(window.updateCartCount)window.updateCartCount();}catch(e){}};
  window.removeItem=async function(id){try{await fetch(API+'/item/'+id,{method:'DELETE',headers:getAuthHeaders(),credentials:'include'});loadCart();if(window.updateCartCount)window.updateCartCount();}catch(e){}};
  function getAuthHeaders(){var t=localStorage.getItem('access_token');return t?{'Authorization':'Bearer '+t}:{};}
})();`;

    const checkoutJs = `(function(){
  'use strict';
  var API='/api/shop';
  document.addEventListener('DOMContentLoaded',function(){loadOrderSummary();setupForm();});
  async function loadOrderSummary(){var el=document.getElementById('orderItems');if(!el)return;try{var r=await fetch(API+'/cart',{credentials:'include',headers:getAuthHeaders()});if(!r.ok)throw new Error();var cart=await r.json();if(!cart.items||cart.items.length===0){window.location.href='/cart';return;}renderItems(cart.items);updateTotals(cart);}catch(e){el.innerHTML='<p>Failed to load</p>';}}
  function renderItems(items){var el=document.getElementById('orderItems');if(!el)return;el.innerHTML=items.map(i=>{var isCourse=i.type==='COURSE';var img=i.product?.images?.[0]||i.course?.thumbnail||'/placeholder.jpg';var title=i.product?.name||i.course?.title||'Item';var price=i.product?.price||i.course?.price||0;return '<div style="display:flex;gap:0.75rem;padding:0.75rem 0;border-bottom:1px solid var(--color-border);font-size:0.9rem;"><img src="'+img+'" style="width:50px;height:50px;object-fit:cover;border-radius:4px;"><div style="flex:1;"><div style="font-weight:500;">'+title+'</div><div style="color:var(--color-text-muted);font-size:0.85rem;">'+(isCourse?'Course':'Qty: '+i.quantity)+'</div></div><div style="font-weight:500;">$'+(parseFloat(price)*i.quantity).toFixed(2)+'</div></div>';}).join('');}
  function updateTotals(cart){var sub=cart.items.reduce((s,i)=>{var p=i.product?.price||i.course?.price||0;return s+(parseFloat(p)*i.quantity);},0);var tax=sub*0.1;document.getElementById('subtotal').textContent='$'+sub.toFixed(2);document.getElementById('tax').textContent='$'+tax.toFixed(2);document.getElementById('total').textContent='$'+(sub+tax).toFixed(2);}
  function setupForm(){var form=document.getElementById('checkoutForm');if(!form)return;form.addEventListener('submit',async function(e){e.preventDefault();var btn=document.getElementById('placeOrderBtn'),txt=btn.querySelector('.btn-text'),load=btn.querySelector('.btn-loading');txt.style.display='none';load.style.display='inline';btn.disabled=true;var fd=new FormData(form);try{var r=await fetch(API+'/orders',{method:'POST',headers:{'Content-Type':'application/json',...getAuthHeaders()},body:JSON.stringify({email:fd.get('email'),billingAddress:{firstName:fd.get('firstName'),lastName:fd.get('lastName'),address:fd.get('address'),city:fd.get('city'),state:fd.get('state'),postalCode:fd.get('postalCode'),country:fd.get('country')}}),credentials:'include'});if(r.ok){var o=await r.json();alert('Order placed! ID: '+o.id);window.location.href='/';}else{var e=await r.json();alert(e.message||'Failed');resetBtn(btn,txt,load);}}catch(e){alert('Error');resetBtn(btn,txt,load);}});}
  function resetBtn(b,t,l){t.style.display='inline';l.style.display='none';b.disabled=false;}
  function getAuthHeaders(){var t=localStorage.getItem('access_token');return t?{'Authorization':'Bearer '+t}:{};}
})();`;

    return {
      main: mainJs,
      auth: authJs,
      cart: cartJs,
      checkout: checkoutJs,
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
