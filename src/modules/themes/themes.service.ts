/**
 * Themes Service
 * Handles theme management and activation
 */

import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as AdmZip from 'adm-zip';

// Required template files for a valid theme
const REQUIRED_TEMPLATES = [
  'templates/home.hbs',
  'templates/single-post.hbs',
  'templates/single-page.hbs',
];

// Required fields in theme.json
const REQUIRED_THEME_JSON_FIELDS = ['name', 'version', 'author'];

// Maximum theme file size (10MB)
const MAX_THEME_SIZE = 10 * 1024 * 1024;

export interface ThemeValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  themeConfig?: any;
  themeSlug?: string;
  rootFolder?: string;
  hasScreenshot?: boolean;
}

// Theme design configuration for visual builder
// Media block for WYSIWYG editor
export interface ThemeMediaBlock {
  id: string;
  type: 'image' | 'video' | 'audio' | 'text';
  src?: string;
  content?: string;
  title?: string;
  artist?: string;
  coverImage?: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
}

export interface ThemeDesignConfig {
  // Metadata
  name: string;
  author: string;
  version: string;
  description?: string;
  // Colors
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
  };
  // Typography
  typography: {
    headingFont: string;
    bodyFont: string;
    baseFontSize: number;
    lineHeight: number;
    headingWeight: number;
  };
  // Layout
  layout: {
    sidebarPosition: 'left' | 'right' | 'none';
    contentWidth: number;
    headerStyle: 'default' | 'centered' | 'minimal';
  };
  // Spacing
  spacing: {
    sectionPadding: number;
    elementSpacing: number;
    containerPadding: number;
  };
  // Borders
  borders: {
    radius: number;
    width: number;
  };
  // Template
  baseTemplate: string;
  // Media blocks from WYSIWYG editor
  mediaBlocks?: ThemeMediaBlock[];
}

@Injectable()
export class ThemesService implements OnModuleInit {
  private themesDir = path.join(process.cwd(), 'themes');

  constructor(private prisma: PrismaService) {}

  /**
   * Lifecycle hook - runs when module is initialized
   * Automatically scans and loads themes on startup
   */
  async onModuleInit() {
    try {
      await this.scanThemes();
    } catch (error) {
      console.error('Error scanning themes on module init:', error);
    }
  }

  /**
   * Scan themes directory and register themes
   */
  async scanThemes() {
    try {
      const dirs = await fs.readdir(this.themesDir);
      const themes: any[] = [];

      for (const dir of dirs) {
        const themePath = path.join(this.themesDir, dir);
        const stat = await fs.stat(themePath);

        if (stat.isDirectory()) {
          const configPath = path.join(themePath, 'theme.json');

          try {
            const configContent = await fs.readFile(configPath, 'utf-8');
            const config = JSON.parse(configContent);

            // Upsert theme in database
            const theme = await this.prisma.theme.upsert({
              where: { slug: dir },
              update: {
                name: config.name,
                version: config.version,
                author: config.author,
                description: config.description,
                thumbnail: config.thumbnail,
                config,
              },
              create: {
                name: config.name,
                slug: dir,
                version: config.version,
                author: config.author,
                description: config.description,
                thumbnail: config.thumbnail,
                path: `/themes/${dir}`,
                config,
              },
            });

            themes.push(theme);
          } catch (error) {
            console.error(`Error loading theme ${dir}:`, error.message);
          }
        }
      }

      // Fix data integrity: ensure only one theme is active
      await this.ensureSingleActiveTheme();

      return themes;
    } catch (error) {
      console.error('Error scanning themes:', error);
      return [];
    }
  }

  /**
   * Ensure only one theme is active (data integrity fix)
   */
  private async ensureSingleActiveTheme() {
    const activeThemes = await this.prisma.theme.findMany({
      where: { isActive: true },
      orderBy: { updatedAt: 'desc' },
    });

    if (activeThemes.length > 1) {
      // Keep only the most recently updated active theme
      const [keepActive, ...deactivate] = activeThemes;
      console.log(
        `Fixing data: ${deactivate.length} extra active themes found. Keeping "${keepActive.name}" as active.`,
      );

      await this.prisma.theme.updateMany({
        where: {
          id: { in: deactivate.map((t) => t.id) },
        },
        data: { isActive: false },
      });
    } else if (activeThemes.length === 0) {
      // No active theme - activate the first available theme
      const firstTheme = await this.prisma.theme.findFirst({
        orderBy: { name: 'asc' },
      });
      if (firstTheme) {
        await this.prisma.theme.update({
          where: { id: firstTheme.id },
          data: { isActive: true },
        });
        console.log(`No active theme found. Activated "${firstTheme.name}".`);
      }
    }
  }

  /**
   * Get all themes
   */
  async findAll() {
    // Ensure data integrity before returning themes
    await this.ensureSingleActiveTheme();

    return this.prisma.theme.findMany({
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get theme by ID
   */
  async findById(id: string) {
    const theme = await this.prisma.theme.findUnique({
      where: { id },
    });

    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    return theme;
  }

  /**
   * Get active theme
   */
  async getActiveTheme() {
    const theme = await this.prisma.theme.findFirst({
      where: { isActive: true },
    });

    if (!theme) {
      throw new NotFoundException('No active theme found');
    }

    return theme;
  }

  /**
   * Activate a theme
   */
  async activate(id: string) {
    // Deactivate all themes
    await this.prisma.theme.updateMany({
      data: { isActive: false },
    });

    // Activate the selected theme
    return this.prisma.theme.update({
      where: { id },
      data: { isActive: true },
    });
  }

  /**
   * Get theme template path
   */
  getTemplatePath(themeSlug: string, template: string): string {
    return path.join(this.themesDir, themeSlug, 'templates', `${template}.hbs`);
  }

  /**
   * Get theme partials directory path
   */
  getPartialsPath(themeSlug: string): string {
    return path.join(this.themesDir, themeSlug, 'partials');
  }

  /**
   * Validate theme ZIP file without extracting
   */
  validateThemeZip(file: Express.Multer.File): ThemeValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file type
    if (!file.originalname.endsWith('.zip')) {
      errors.push('Only ZIP files are allowed');
      return { valid: false, errors, warnings };
    }

    // Check file size
    if (file.size > MAX_THEME_SIZE) {
      errors.push(`File size exceeds maximum allowed size of ${MAX_THEME_SIZE / 1024 / 1024}MB`);
      return { valid: false, errors, warnings };
    }

    try {
      const zip = new AdmZip(file.buffer);
      const zipEntries = zip.getEntries();
      const entryNames = zipEntries
        .filter((e) => !e.entryName.includes('__MACOSX'))
        .map((e) => e.entryName);

      // Find theme.json
      let themeConfig: any = null;
      let themeSlug: string | null = null;
      let rootFolder: string | null = null;

      for (const entry of zipEntries) {
        if (entry.entryName.endsWith('theme.json') && !entry.entryName.includes('__MACOSX')) {
          try {
            const configContent = entry.getData().toString('utf8');
            themeConfig = JSON.parse(configContent);
            const parts = entry.entryName.split('/');
            rootFolder = parts.length > 1 ? parts[0] : null;
            themeSlug = rootFolder || file.originalname.replace('.zip', '');
          } catch (_parseError) {
            errors.push('theme.json contains invalid JSON');
            return { valid: false, errors, warnings };
          }
          break;
        }
      }

      if (!themeConfig) {
        errors.push('Missing required file: theme.json');
        return { valid: false, errors, warnings };
      }

      // Validate required theme.json fields
      for (const field of REQUIRED_THEME_JSON_FIELDS) {
        if (!themeConfig[field]) {
          errors.push(`theme.json missing required field: ${field}`);
        }
      }

      // Check for required template files
      for (const template of REQUIRED_TEMPLATES) {
        const templatePath = rootFolder ? `${rootFolder}/${template}` : template;
        const found = entryNames.some(
          (name) => name === templatePath || name === template || name.endsWith(`/${template}`),
        );
        if (!found) {
          errors.push(`Missing required template: ${template}`);
        }
      }

      // Check for optional files
      const hasScreenshot = entryNames.some(
        (name) => name.endsWith('screenshot.png') || name.endsWith('screenshot.jpg'),
      );
      if (!hasScreenshot) {
        warnings.push('No screenshot.png found. A preview image is recommended.');
      }

      const hasArchive = entryNames.some(
        (name) => name.endsWith('templates/archive.hbs') || name === 'archive.hbs',
      );
      if (!hasArchive) {
        warnings.push('No archive.hbs template found. This template is optional but recommended.');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        themeConfig,
        themeSlug: themeSlug!,
        rootFolder: rootFolder || undefined,
        hasScreenshot,
      };
    } catch (error) {
      errors.push('Failed to read ZIP file: ' + error.message);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Validate theme ZIP and return validation result (without installing)
   */
  async validateTheme(
    file: Express.Multer.File,
  ): Promise<ThemeValidationResult & { exists?: boolean }> {
    const validation = this.validateThemeZip(file);

    if (validation.valid && validation.themeSlug) {
      const existingTheme = await this.prisma.theme.findUnique({
        where: { slug: validation.themeSlug },
      });
      if (existingTheme) {
        validation.errors.push(
          `Theme "${validation.themeSlug}" already exists. Please delete it first or use a different folder name.`,
        );
        validation.valid = false;
        return { ...validation, exists: true };
      }
    }

    return validation;
  }

  /**
   * Upload and install a theme from ZIP file
   */
  async uploadTheme(file: Express.Multer.File) {
    // Validate the theme first
    const validation = await this.validateTheme(file);

    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Theme validation failed',
        errors: validation.errors,
        warnings: validation.warnings,
      });
    }

    const { themeConfig, themeSlug, rootFolder } = validation;

    try {
      const zip = new AdmZip(file.buffer);
      const zipEntries = zip.getEntries();

      // Extract theme to themes directory
      const themePath = path.join(this.themesDir, themeSlug!);
      await fs.mkdir(themePath, { recursive: true });

      // Extract all files
      for (const entry of zipEntries) {
        if (entry.entryName.includes('__MACOSX')) continue;

        // Remove root folder from path if it exists
        let entryPath = entry.entryName;
        if (rootFolder && entryPath.startsWith(rootFolder + '/')) {
          entryPath = entryPath.substring(rootFolder.length + 1);
        }

        if (!entryPath) continue;

        const fullPath = path.join(themePath, entryPath);

        if (entry.isDirectory) {
          await fs.mkdir(fullPath, { recursive: true });
        } else {
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, entry.getData());
        }
      }

      // Determine thumbnail path
      let thumbnailPath = themeConfig!.thumbnail || null;
      if (!thumbnailPath && validation.hasScreenshot) {
        thumbnailPath = `/themes/${themeSlug}/screenshot.png`;
      }

      // Register theme in database
      const theme = await this.prisma.theme.create({
        data: {
          name: themeConfig!.name,
          slug: themeSlug!,
          version: themeConfig!.version,
          author: themeConfig!.author || 'Unknown',
          description: themeConfig!.description || '',
          thumbnail: thumbnailPath,
          path: `/themes/${themeSlug}`,
          config: themeConfig,
        },
      });

      return {
        ...theme,
        warnings: validation.warnings,
      };
    } catch (error) {
      // Clean up on failure
      try {
        const themePath = path.join(this.themesDir, themeSlug!);
        await fs.rm(themePath, { recursive: true, force: true });
      } catch {}

      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error uploading theme:', error);
      throw new BadRequestException('Failed to upload theme: ' + error.message);
    }
  }

  /**
   * Delete a theme
   */
  async deleteTheme(id: string) {
    const theme = await this.findById(id);

    // Prevent deleting active theme
    if (theme.isActive) {
      throw new BadRequestException(
        'Cannot delete the active theme. Please activate another theme first.',
      );
    }

    // Delete theme directory
    const themePath = path.join(this.themesDir, theme.slug);
    try {
      await fs.rm(themePath, { recursive: true, force: true });
    } catch (error) {
      console.error('Error deleting theme directory:', error);
    }

    // Delete from database
    return this.prisma.theme.delete({
      where: { id },
    });
  }

  /**
   * Generate and install a theme from visual builder configuration
   */
  async generateTheme(config: ThemeDesignConfig) {
    // Create slug from name
    const slug = config.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if theme already exists
    const existingTheme = await this.prisma.theme.findUnique({
      where: { slug },
    });
    if (existingTheme) {
      throw new BadRequestException(
        `Theme "${slug}" already exists. Please choose a different name.`,
      );
    }

    const themePath = path.join(this.themesDir, slug);

    try {
      // Create theme directory structure
      await fs.mkdir(themePath, { recursive: true });
      await fs.mkdir(path.join(themePath, 'templates'), { recursive: true });
      await fs.mkdir(path.join(themePath, 'assets'), { recursive: true });
      await fs.mkdir(path.join(themePath, 'assets', 'css'), { recursive: true });
      await fs.mkdir(path.join(themePath, 'assets', 'media'), { recursive: true });

      // Copy media files from WYSIWYG editor
      if (config.mediaBlocks && config.mediaBlocks.length > 0) {
        await this.copyMediaFiles(config.mediaBlocks, themePath);
      }

      // Generate theme.json
      const themeJson = {
        name: config.name,
        version: config.version,
        author: config.author,
        description: config.description || `Custom theme created with Theme Designer`,
        thumbnail: `/themes/${slug}/screenshot.png`,
        designConfig: JSON.parse(JSON.stringify(config)),
        mediaBlocks: config.mediaBlocks || [],
      };
      await fs.writeFile(path.join(themePath, 'theme.json'), JSON.stringify(themeJson, null, 2));

      // Generate CSS variables
      const cssContent = this.generateThemeCSS(config);
      await fs.writeFile(path.join(themePath, 'assets', 'css', 'theme.css'), cssContent);

      // Generate Handlebars templates
      const templates = this.generateThemeTemplates(config, slug);
      for (const [name, content] of Object.entries(templates)) {
        await fs.writeFile(path.join(themePath, 'templates', `${name}.hbs`), content);
      }

      // Generate a simple screenshot placeholder
      await this.generateScreenshotPlaceholder(themePath, config);

      // Register theme in database
      const theme = await this.prisma.theme.create({
        data: {
          name: config.name,
          slug,
          version: config.version,
          author: config.author,
          description: config.description || `Custom theme created with Theme Designer`,
          thumbnail: `/themes/${slug}/screenshot.png`,
          path: `/themes/${slug}`,
          config: JSON.parse(JSON.stringify(themeJson)),
        },
      });

      return theme;
    } catch (error) {
      // Clean up on failure
      try {
        await fs.rm(themePath, { recursive: true, force: true });
      } catch {}

      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error generating theme:', error);
      throw new BadRequestException('Failed to generate theme: ' + error.message);
    }
  }

  /**
   * Generate CSS file with theme variables
   */
  private generateThemeCSS(config: ThemeDesignConfig): string {
    const { colors, typography, layout, spacing, borders } = config;

    return `/* Theme: ${config.name} - Generated by Theme Designer */

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

  /* Typography */
  --font-heading: ${typography.headingFont};
  --font-body: ${typography.bodyFont};
  --font-size-base: ${typography.baseFontSize}px;
  --line-height: ${typography.lineHeight};
  --heading-weight: ${typography.headingWeight};

  /* Layout */
  --content-width: ${layout.contentWidth}px;
  --sidebar-position: ${layout.sidebarPosition};

  /* Spacing */
  --section-padding: ${spacing.sectionPadding}px;
  --element-spacing: ${spacing.elementSpacing}px;
  --container-padding: ${spacing.containerPadding}px;

  /* Borders */
  --border-radius: ${borders.radius}px;
  --border-width: ${borders.width}px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-body), system-ui, sans-serif;
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  color: var(--color-text);
  background-color: var(--color-background);
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading), system-ui, sans-serif;
  font-weight: var(--heading-weight);
  color: var(--color-heading);
  margin-bottom: var(--element-spacing);
}

h1 { font-size: 2.5rem; }
h2 { font-size: 2rem; }
h3 { font-size: 1.5rem; }
h4 { font-size: 1.25rem; }

a {
  color: var(--color-link);
  text-decoration: none;
  transition: color 0.2s ease;
}
a:hover { color: var(--color-link-hover); }

p { margin-bottom: var(--element-spacing); }

.container {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0 var(--container-padding);
}

/* Header */
.site-header {
  background-color: var(--color-surface);
  border-bottom: var(--border-width) solid var(--color-border);
  padding: var(--section-padding) 0;
}

.site-header.header-centered { text-align: center; }
.site-header.header-minimal { padding: calc(var(--section-padding) / 2) 0; }

.site-title {
  font-size: 1.75rem;
  font-weight: var(--heading-weight);
  color: var(--color-heading);
  margin: 0;
}

.site-header .container {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.site-nav {
  display: flex;
  gap: 1.5rem;
  flex: 1;
}

.site-nav.nav-centered { justify-content: center; }
.site-nav a { color: var(--color-text); font-weight: 500; }
.site-nav a:hover { color: var(--color-primary); }

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.cart-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white !important;
  border-radius: var(--border-radius);
  font-weight: 500;
}
.cart-link:hover {
  background: var(--color-primary-hover, var(--color-primary));
  opacity: 0.9;
}

/* Main Content */
.site-main {
  padding: var(--section-padding) 0;
  min-height: 60vh;
}

.content-wrapper {
  display: ${layout.sidebarPosition === 'none' ? 'block' : 'grid'};
  ${layout.sidebarPosition !== 'none' ? `grid-template-columns: ${layout.sidebarPosition === 'left' ? '280px 1fr' : '1fr 280px'};` : ''}
  gap: calc(var(--section-padding) * 1.5);
}

.main-content { min-width: 0; }

/* Sidebar */
.sidebar {
  ${layout.sidebarPosition === 'left' ? 'order: -1;' : ''}
}

.widget {
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--section-padding);
  margin-bottom: var(--element-spacing);
}

.widget-title {
  font-size: 1.1rem;
  margin-bottom: calc(var(--element-spacing) * 0.75);
  padding-bottom: calc(var(--element-spacing) * 0.5);
  border-bottom: var(--border-width) solid var(--color-border);
}

/* Posts */
.post, .page-content {
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--section-padding);
  margin-bottom: var(--element-spacing);
}

.post-title {
  font-size: 1.75rem;
  margin-bottom: calc(var(--element-spacing) * 0.5);
}

.post-title a { color: var(--color-heading); }
.post-title a:hover { color: var(--color-primary); }

.post-meta {
  color: var(--color-text-muted);
  font-size: 0.875rem;
  margin-bottom: var(--element-spacing);
}

.post-excerpt, .post-content { line-height: 1.7; }

.read-more {
  display: inline-block;
  margin-top: var(--element-spacing);
  padding: 0.5rem 1rem;
  background: var(--color-primary);
  color: white;
  border-radius: var(--border-radius);
  font-weight: 500;
}
.read-more:hover { background: var(--color-secondary); color: white; }

/* Footer */
.site-footer {
  background: var(--color-surface);
  border-top: var(--border-width) solid var(--color-border);
  padding: var(--section-padding) 0;
  text-align: center;
  color: var(--color-text-muted);
}

/* Utility */
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s ease;
}
.btn:hover { background: var(--color-secondary); color: white; }

.card {
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius);
  padding: var(--section-padding);
}

/* Footer Navigation */
.footer-nav {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}
.footer-nav a {
  color: var(--color-text);
  opacity: 0.8;
}
.footer-nav a:hover {
  color: var(--color-primary);
  opacity: 1;
}

@media (max-width: 768px) {
  .content-wrapper { grid-template-columns: 1fr; }
  .sidebar { order: 1; }
  h1 { font-size: 2rem; }
  h2 { font-size: 1.5rem; }
  .site-nav, .footer-nav { flex-direction: column; gap: 0.5rem; text-align: center; }
}

/* WYSIWYG Content Blocks */
.wysiwyg-content {
  margin-bottom: var(--section-padding);
}

.wysiwyg-block {
  margin-bottom: var(--element-spacing);
}

.wysiwyg-text {
  font-size: var(--font-size-base);
  line-height: var(--line-height);
  color: var(--color-text);
}

.wysiwyg-image img,
.wysiwyg-video video {
  max-width: 100%;
  height: auto;
  border-radius: var(--border-radius);
}

.wysiwyg-audio {
  padding: 1rem;
  background: var(--color-surface);
  border-radius: var(--border-radius);
}

.wysiwyg-audio audio {
  width: 100%;
  max-width: 400px;
}

.wysiwyg-audio p {
  margin-top: 0.5rem;
  font-weight: 500;
}

/* Shop Styles */
.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--section-padding);
}

.product-card {
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius);
  overflow: hidden;
  transition: transform 0.2s, box-shadow 0.2s;
}
.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.product-card .product-image img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-info {
  padding: 1rem;
}

.product-name {
  font-size: 1.1rem;
  margin: 0 0 0.5rem;
}
.product-name a {
  color: var(--color-heading);
}

.product-price {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--color-primary);
  margin-bottom: 1rem;
}
.price-sale {
  color: #e53e3e;
}
.price-regular {
  text-decoration: line-through;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

.btn-primary {
  display: inline-block;
  background: var(--color-primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: var(--border-radius);
  text-decoration: none;
  font-weight: 500;
  border: none;
  cursor: pointer;
}
.btn-primary:hover {
  opacity: 0.9;
}
.btn-lg {
  padding: 1rem 2rem;
  font-size: 1.1rem;
}

/* Single Product */
.product-single {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: calc(var(--section-padding) * 2);
}
.product-gallery img {
  width: 100%;
  border-radius: var(--border-radius);
}
.product-thumbnails {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.product-thumb {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--border-radius);
  cursor: pointer;
}
.product-title {
  font-size: 2rem;
  margin: 0 0 1rem;
}
.product-actions {
  margin: 1.5rem 0;
}
.quantity-input {
  width: 80px;
  padding: 0.5rem;
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius);
  margin-right: 1rem;
}
.product-description {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: var(--border-width) solid var(--color-border);
}

/* Cart */
.cart-items {
  margin-bottom: 2rem;
}
.cart-item {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1rem;
  background: var(--color-surface);
  border: var(--border-width) solid var(--color-border);
  border-radius: var(--border-radius);
  margin-bottom: 1rem;
}
.cart-item-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: var(--border-radius);
}
.cart-item-info {
  flex: 1;
}
.cart-item-info h3 {
  margin: 0 0 0.5rem;
}
.cart-summary {
  text-align: right;
  padding: 1.5rem;
  background: var(--color-surface);
  border-radius: var(--border-radius);
}
.cart-total {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}
.btn-remove {
  background: #e53e3e;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  cursor: pointer;
}

@media (max-width: 768px) {
  .product-single { grid-template-columns: 1fr; }
  .cart-item { flex-wrap: wrap; }
}
`;
  }

  /**
   * Generate HTML content from WYSIWYG media blocks
   */
  private generateMediaBlocksHtml(
    mediaBlocks: ThemeMediaBlock[] | undefined,
    slug: string,
  ): string {
    if (!mediaBlocks || mediaBlocks.length === 0) return '';

    return mediaBlocks
      .map((block) => {
        const alignStyle = block.align ? `text-align: ${block.align};` : '';
        const widthStyle = block.width ? `max-width: ${block.width}%;` : '';

        switch (block.type) {
          case 'text':
            return `<div class="wysiwyg-block wysiwyg-text" style="${alignStyle}">${block.content || ''}</div>`;
          case 'image':
            if (!block.src) return '';
            const imgSrc = block.src.startsWith('/uploads/')
              ? `/themes/${slug}/assets/media/${block.src.replace(/^\/uploads\//, '')}`
              : block.src;
            return `<div class="wysiwyg-block wysiwyg-image" style="${alignStyle}"><img src="${imgSrc}" alt="" style="${widthStyle} display: inline-block;"></div>`;
          case 'video':
            if (!block.src) return '';
            const videoSrc = block.src.startsWith('/uploads/')
              ? `/themes/${slug}/assets/media/${block.src.replace(/^\/uploads\//, '')}`
              : block.src;
            return `<div class="wysiwyg-block wysiwyg-video" style="${alignStyle}"><video src="${videoSrc}" controls style="${widthStyle} display: inline-block;"></video></div>`;
          case 'audio':
            if (!block.src) return '';
            const audioSrc = block.src.startsWith('/uploads/')
              ? `/themes/${slug}/assets/media/${block.src.replace(/^\/uploads\//, '')}`
              : block.src;
            return `<div class="wysiwyg-block wysiwyg-audio" style="${alignStyle}"><audio src="${audioSrc}" controls></audio><p>${block.title || 'Audio Track'}</p></div>`;
          default:
            return '';
        }
      })
      .join('\n          ');
  }

  /**
   * Generate all Handlebars template files
   */
  private generateThemeTemplates(config: ThemeDesignConfig, slug: string): Record<string, string> {
    const { layout } = config;
    const headerClass =
      layout.headerStyle === 'centered'
        ? 'header-centered'
        : layout.headerStyle === 'minimal'
          ? 'header-minimal'
          : '';
    const navClass = layout.headerStyle === 'centered' ? 'nav-centered' : '';

    // Generate HTML from WYSIWYG media blocks
    const wysiwygContent = this.generateMediaBlocksHtml(config.mediaBlocks, slug);
    const hasSidebar = layout.sidebarPosition !== 'none';

    // Admin bar styles and HTML
    const adminBarStyles = `
  <style id="admin-bar-styles">
    .admin-bar { display: none; position: fixed; top: 0; left: 0; right: 0; height: 32px; background: #1e1e1e; color: #fff; font-size: 13px; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; z-index: 99999; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
    .admin-bar.visible { display: flex; }
    .admin-bar-container { display: flex; align-items: center; justify-content: space-between; max-width: 1400px; margin: 0 auto; padding: 0 16px; height: 100%; }
    .admin-bar-left, .admin-bar-right { display: flex; align-items: center; gap: 12px; }
    .admin-bar a { color: #a0aec0; text-decoration: none; padding: 4px 8px; border-radius: 4px; transition: all 0.2s; }
    .admin-bar a:hover { color: #fff; background: rgba(255,255,255,0.1); }
    .admin-bar .customize-btn { background: #3b82f6; color: #fff; font-weight: 500; }
    .admin-bar .customize-btn:hover { background: #2563eb; }
    .admin-bar .user-info { color: #718096; }
    body.has-admin-bar { padding-top: 32px; }
    body.has-admin-bar .site-header { top: 32px; }
  </style>`;

    const adminBarHtml = `
  <div id="admin-bar" class="admin-bar">
    <div class="admin-bar-container">
      <div class="admin-bar-left">
        <a id="admin-link-dashboard" href="#">← Dashboard</a>
        <a id="admin-link-posts" href="#">Posts</a>
        <a id="admin-link-pages" href="#">Pages</a>
        <a id="admin-link-customize" href="#" class="customize-btn">✎ Customize</a>
      </div>
      <div class="admin-bar-right">
        <span class="user-info" id="admin-bar-user"></span>
        <a id="admin-link-settings" href="#">Settings</a>
      </div>
    </div>
  </div>`;

    // Common layout wrapper
    const layoutStart = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{#if title}}{{title}} - {{/if}}{{site.name}}</title>
  <link rel="stylesheet" href="/themes/${slug}/assets/css/theme.css">
  ${adminBarStyles}
</head>
<body>
  ${adminBarHtml}
  <header class="site-header ${headerClass}">
    <div class="container">
      <h1 class="site-title"><a href="/">{{site.name}}</a></h1>
      <nav class="site-nav ${navClass}">
        {{#if menus.header}}
          {{#each menus.header.items}}
          <a href="{{this.url}}" target="{{this.target}}">{{this.label}}</a>
          {{/each}}
        {{else}}
          <a href="/">Home</a>
          <a href="/blog">Blog</a>
          <a href="/shop">Shop</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
        {{/if}}
      </nav>
      <div class="header-actions">
        <a href="/shop/cart" class="cart-link">🛒 Cart</a>
      </div>
    </div>
  </header>

  <main class="site-main">
    <div class="container">
      <div class="content-wrapper">
        <div class="main-content">`;

    const sidebarContent = hasSidebar
      ? `
        <aside class="sidebar">
          <div class="widget">
            <h3 class="widget-title">About</h3>
            <p>{{site.description}}</p>
          </div>
          <div class="widget">
            <h3 class="widget-title">Categories</h3>
            <ul>
              {{#each categories}}
              <li><a href="/category/{{this.slug}}">{{this.name}}</a></li>
              {{/each}}
            </ul>
          </div>
          <div class="widget">
            <h3 class="widget-title">Recent Posts</h3>
            <ul>
              {{#each recentPosts}}
              <li><a href="/{{this.slug}}">{{this.title}}</a></li>
              {{/each}}
            </ul>
          </div>
        </aside>`
      : '';

    // Admin bar script
    const adminBarScript = `
  <script>
    (function() {
      try {
        var authData = localStorage.getItem('auth-storage');
        if (!authData) return;
        var parsed = JSON.parse(authData);
        var user = parsed && parsed.state && parsed.state.user;
        if (user && (user.role === 'ADMIN' || user.role === 'EDITOR')) {
          var adminBar = document.getElementById('admin-bar');
          var userInfo = document.getElementById('admin-bar-user');
          if (adminBar) { adminBar.classList.add('visible'); document.body.classList.add('has-admin-bar'); }
          if (userInfo) { userInfo.textContent = 'Logged in as ' + user.name + ' (' + user.role + ')'; }
          // Set admin panel URLs dynamically
          var adminBase = window.location.port === '3000' ? 'http://localhost:5173' : '';
          var setLink = function(id, path) { var el = document.getElementById(id); if (el) el.href = adminBase + path; };
          setLink('admin-link-dashboard', '/admin');
          setLink('admin-link-posts', '/admin/posts');
          setLink('admin-link-pages', '/admin/pages');
          setLink('admin-link-customize', '/admin/customize');
          setLink('admin-link-settings', '/admin/settings');
        }
      } catch (e) {}
    })();
  </script>`;

    const layoutEnd = `
        </div>${sidebarContent}
      </div>
    </div>
  </main>

  <footer class="site-footer">
    <div class="container">
      {{#if menus.footer}}
      <nav class="footer-nav">
        {{#each menus.footer.items}}
        <a href="{{this.url}}" target="{{this.target}}">{{this.label}}</a>
        {{/each}}
      </nav>
      {{/if}}
      <p>&copy; {{year}} {{site.name}}. All rights reserved.</p>
    </div>
  </footer>
  ${adminBarScript}
</body>
</html>`;

    return {
      home: `${layoutStart}
          ${
            wysiwygContent
              ? `<!-- Custom WYSIWYG Content -->
          <section class="wysiwyg-content">
          ${wysiwygContent}
          </section>
          <hr style="margin: 2rem 0; border-color: var(--color-border);">`
              : ''
          }
          <h2>Latest Posts</h2>
          {{#each posts}}
          <article class="post">
            <h2 class="post-title"><a href="/{{this.slug}}">{{this.title}}</a></h2>
            <div class="post-meta">
              <span>By {{this.author.name}}</span> &bull;
              <span>{{formatDate this.createdAt}}</span>
              {{#if this.category}}
              &bull; <a href="/category/{{this.category.slug}}">{{this.category.name}}</a>
              {{/if}}
            </div>
            <div class="post-excerpt">
              {{truncate this.content 200}}
            </div>
            <a href="/{{this.slug}}" class="read-more">Read More</a>
          </article>
          {{else}}
          <p>No posts yet. Check back soon!</p>
          {{/each}}

          {{#if pagination}}
          <nav class="pagination">
            {{#if pagination.hasPrev}}<a href="?page={{pagination.prevPage}}">&larr; Previous</a>{{/if}}
            <span>Page {{pagination.currentPage}} of {{pagination.totalPages}}</span>
            {{#if pagination.hasNext}}<a href="?page={{pagination.nextPage}}">Next &rarr;</a>{{/if}}
          </nav>
          {{/if}}
${layoutEnd}`,

      'single-post': `${layoutStart}
          <article class="post">
            <h1 class="post-title">{{post.title}}</h1>
            <div class="post-meta">
              <span>By {{post.author.name}}</span> &bull;
              <span>{{formatDate post.createdAt}}</span>
              {{#if post.category}}
              &bull; <a href="/category/{{post.category.slug}}">{{post.category.name}}</a>
              {{/if}}
            </div>
            {{#if post.featuredImage}}
            <img src="{{post.featuredImage}}" alt="{{post.title}}" class="post-image">
            {{/if}}
            <div class="post-content">
              {{{post.content}}}
            </div>
            {{#if post.tags.length}}
            <div class="post-tags">
              <strong>Tags:</strong>
              {{#each post.tags}}<a href="/tag/{{this.slug}}">{{this.name}}</a>{{#unless @last}}, {{/unless}}{{/each}}
            </div>
            {{/if}}
          </article>

          <nav class="post-navigation">
            {{#if prevPost}}<a href="/{{prevPost.slug}}">&larr; {{prevPost.title}}</a>{{/if}}
            {{#if nextPost}}<a href="/{{nextPost.slug}}">{{nextPost.title}} &rarr;</a>{{/if}}
          </nav>
${layoutEnd}`,

      'single-page': `${layoutStart}
          <article class="page-content">
            <h1 class="post-title">{{page.title}}</h1>
            <div class="post-content">
              {{{page.content}}}
            </div>
          </article>
${layoutEnd}`,

      archive: `${layoutStart}
          <h1>{{#if category}}Category: {{category.name}}{{else if tag}}Tag: {{tag.name}}{{else}}Archive{{/if}}</h1>

          {{#each posts}}
          <article class="post">
            <h2 class="post-title"><a href="/{{this.slug}}">{{this.title}}</a></h2>
            <div class="post-meta">
              <span>By {{this.author.name}}</span> &bull;
              <span>{{formatDate this.createdAt}}</span>
            </div>
            <div class="post-excerpt">
              {{truncate this.content 150}}
            </div>
            <a href="/{{this.slug}}" class="read-more">Read More</a>
          </article>
          {{else}}
          <p>No posts found.</p>
          {{/each}}

          {{#if pagination}}
          <nav class="pagination">
            {{#if pagination.hasPrev}}<a href="?page={{pagination.prevPage}}">&larr; Previous</a>{{/if}}
            <span>Page {{pagination.currentPage}} of {{pagination.totalPages}}</span>
            {{#if pagination.hasNext}}<a href="?page={{pagination.nextPage}}">Next &rarr;</a>{{/if}}
          </nav>
          {{/if}}
${layoutEnd}`,

      shop: `${layoutStart}
          <h1 class="page-title">Shop</h1>
          <div class="products-grid">
            {{#each products}}
            <div class="product-card">
              {{#if this.featuredImage}}
              <a href="/shop/product/{{this.slug}}" class="product-image">
                <img src="{{this.featuredImage}}" alt="{{this.name}}">
              </a>
              {{/if}}
              <div class="product-info">
                <h3 class="product-name"><a href="/shop/product/{{this.slug}}">{{this.name}}</a></h3>
                <div class="product-price">
                  {{#if this.salePrice}}
                  <span class="price-sale">\${{this.salePrice}}</span>
                  <span class="price-regular">\${{this.price}}</span>
                  {{else}}
                  <span class="price">\${{this.price}}</span>
                  {{/if}}
                </div>
                <a href="/shop/product/{{this.slug}}" class="btn btn-primary">View Product</a>
              </div>
            </div>
            {{else}}
            <p>No products available yet.</p>
            {{/each}}
          </div>
${layoutEnd}`,

      'single-product': `${layoutStart}
          <div class="product-single">
            <div class="product-gallery">
              {{#if product.featuredImage}}
              <img src="{{product.featuredImage}}" alt="{{product.name}}" class="product-main-image">
              {{/if}}
              {{#if product.images}}
              <div class="product-thumbnails">
                {{#each product.images}}
                <img src="{{this}}" alt="{{../product.name}}" class="product-thumb">
                {{/each}}
              </div>
              {{/if}}
            </div>
            <div class="product-details">
              <h1 class="product-title">{{product.name}}</h1>
              <div class="product-price">
                {{#if product.salePrice}}
                <span class="price-sale">\${{product.salePrice}}</span>
                <span class="price-regular">\${{product.price}}</span>
                {{else}}
                <span class="price">\${{product.price}}</span>
                {{/if}}
              </div>
              {{#if product.shortDescription}}
              <p class="product-short-desc">{{product.shortDescription}}</p>
              {{/if}}
              <div class="product-actions">
                <form action="/shop/cart/add" method="POST">
                  <input type="hidden" name="productId" value="{{product.id}}">
                  <input type="number" name="quantity" value="1" min="1" class="quantity-input">
                  <button type="submit" class="btn btn-primary btn-lg">Add to Cart</button>
                </form>
              </div>
              {{#if product.description}}
              <div class="product-description">
                <h3>Description</h3>
                {{{product.description}}}
              </div>
              {{/if}}
            </div>
          </div>
${layoutEnd}`,

      cart: `${layoutStart}
          <h1 class="page-title">Shopping Cart</h1>
          {{#if cart.items.length}}
          <div class="cart-items">
            {{#each cart.items}}
            <div class="cart-item">
              {{#if this.product.featuredImage}}
              <img src="{{this.product.featuredImage}}" alt="{{this.product.name}}" class="cart-item-image">
              {{/if}}
              <div class="cart-item-info">
                <h3>{{this.product.name}}</h3>
                <p class="cart-item-price">\${{this.product.price}}</p>
              </div>
              <div class="cart-item-quantity">
                <form action="/shop/cart/update" method="POST">
                  <input type="hidden" name="itemId" value="{{this.id}}">
                  <input type="number" name="quantity" value="{{this.quantity}}" min="1" class="quantity-input">
                  <button type="submit">Update</button>
                </form>
              </div>
              <form action="/shop/cart/remove" method="POST">
                <input type="hidden" name="itemId" value="{{this.id}}">
                <button type="submit" class="btn-remove">Remove</button>
              </form>
            </div>
            {{/each}}
          </div>
          <div class="cart-summary">
            <p class="cart-total"><strong>Total:</strong> \${{cart.total}}</p>
            <a href="/shop/checkout" class="btn btn-primary btn-lg">Proceed to Checkout</a>
          </div>
          {{else}}
          <p>Your cart is empty. <a href="/shop">Continue shopping</a></p>
          {{/if}}
${layoutEnd}`,
    };
  }

  /**
   * Generate a simple SVG screenshot placeholder
   */
  private async generateScreenshotPlaceholder(
    themePath: string,
    config: ThemeDesignConfig,
  ): Promise<void> {
    const { colors } = config;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
  <rect fill="${colors.background}" width="1200" height="900"/>
  <rect fill="${colors.surface}" x="0" y="0" width="1200" height="80"/>
  <text x="40" y="50" font-family="system-ui" font-size="24" font-weight="bold" fill="${colors.heading}">${config.name}</text>
  <rect fill="${colors.surface}" x="40" y="120" width="800" height="400" rx="${config.borders.radius}"/>
  <rect fill="${colors.primary}" x="60" y="140" width="200" height="20" rx="4"/>
  <rect fill="${colors.textMuted}" x="60" y="180" width="720" height="12" rx="2"/>
  <rect fill="${colors.textMuted}" x="60" y="200" width="680" height="12" rx="2"/>
  <rect fill="${colors.textMuted}" x="60" y="220" width="700" height="12" rx="2"/>
  <rect fill="${colors.primary}" x="60" y="480" width="120" height="30" rx="${config.borders.radius}"/>
  <rect fill="${colors.surface}" x="880" y="120" width="280" height="200" rx="${config.borders.radius}"/>
  <rect fill="${colors.border}" x="900" y="140" width="240" height="2"/>
  <rect fill="${colors.surface}" x="880" y="340" width="280" height="180" rx="${config.borders.radius}"/>
  <rect fill="${colors.surface}" x="0" y="820" width="1200" height="80"/>
  <text x="600" y="860" font-family="system-ui" font-size="14" fill="${colors.textMuted}" text-anchor="middle">Theme Preview - ${config.name}</text>
</svg>`;

    // Write as SVG first (can be used as screenshot)
    await fs.writeFile(path.join(themePath, 'screenshot.svg'), svg);
    // Also copy to PNG path for compatibility (actual conversion would need a library)
    await fs.writeFile(path.join(themePath, 'screenshot.png'), svg);
  }

  /**
   * Copy media files from uploads to theme directory
   */
  private async copyMediaFiles(mediaBlocks: ThemeMediaBlock[], themePath: string): Promise<void> {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const mediaDir = path.join(themePath, 'assets', 'media');

    for (const block of mediaBlocks) {
      if (
        block.src &&
        (block.type === 'image' || block.type === 'video' || block.type === 'audio')
      ) {
        try {
          // Extract filename from src path (e.g., /uploads/filename.jpg -> filename.jpg)
          const srcPath = block.src.replace(/^\/uploads\//, '');
          const sourcePath = path.join(uploadsDir, srcPath);
          const destPath = path.join(mediaDir, path.basename(srcPath));

          // Check if source file exists
          try {
            await fs.access(sourcePath);
            await fs.copyFile(sourcePath, destPath);
          } catch {
            // File doesn't exist in uploads, might be an external URL - skip
            console.log('Media file not found:', sourcePath);
          }
        } catch (error) {
          // Use %s placeholder to prevent format string injection
          console.error('Error copying media file: %s', String(block.src), error);
        }
      }

      // Also copy cover image for audio blocks
      if (block.coverImage && block.type === 'audio') {
        try {
          const srcPath = block.coverImage.replace(/^\/uploads\//, '');
          const sourcePath = path.join(uploadsDir, srcPath);
          const destPath = path.join(mediaDir, path.basename(srcPath));

          try {
            await fs.access(sourcePath);
            await fs.copyFile(sourcePath, destPath);
          } catch {
            console.log('Cover image not found:', sourcePath);
          }
        } catch (error) {
          // Use %s placeholder to prevent format string injection
          console.error('Error copying cover image: %s', String(block.coverImage), error);
        }
      }
    }
  }
}
