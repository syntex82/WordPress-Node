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

export interface CreateCustomThemeDto {
  name: string;
  description?: string;
  settings: CustomThemeSettings;
  customCSS?: string;
  isDefault?: boolean;
}

export interface UpdateCustomThemeDto {
  name?: string;
  description?: string;
  settings?: CustomThemeSettings;
  customCSS?: string;
  isDefault?: boolean;
}

@Injectable()
export class CustomThemesService {
  constructor(private prisma: PrismaService) {}

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
        isDefault: dto.isDefault || false,
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
   * Generate CSS from theme settings
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
  ${colors.success ? `--color-success: ${colors.success};` : ''}
  ${colors.warning ? `--color-warning: ${colors.warning};` : ''}
  ${colors.error ? `--color-error: ${colors.error};` : ''}

  /* Typography */
  --font-heading: ${typography.headingFont}, system-ui, sans-serif;
  --font-body: ${typography.bodyFont}, system-ui, sans-serif;
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
}
`;

    if (customCSS) {
      css += `\n/* Custom CSS */\n${customCSS}`;
    }

    return css;
  }
}
