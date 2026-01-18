import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CustomizationRendererService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Escape HTML attribute value to prevent XSS
   */
  private escapeHtmlAttribute(value: string): string {
    if (!value || typeof value !== 'string') return '';
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Validate CSS color value (prevent injection)
   */
  private isValidCssColor(color: string): boolean {
    if (!color || typeof color !== 'string') return false;
    // Allow hex, rgb, rgba, hsl, hsla, and named colors
    const colorPattern = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-zA-Z]+)$/;
    return colorPattern.test(color.trim());
  }

  /**
   * Validate CSS class name (alphanumeric, hyphens, underscores only)
   */
  private isValidClassName(className: string): boolean {
    if (!className || typeof className !== 'string') return false;
    return /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(className);
  }

  /**
   * Apply page customization to rendered HTML
   */
  async applyPageCustomization(html: string, pageId: string): Promise<string> {
    try {
      const customization = await this.prisma.pageCustomization.findUnique({
        where: { pageId },
      });

      if (!customization) {
        return html;
      }

      return this.applyCustomizationStyles(html, customization);
    } catch (error) {
      console.error('Error applying page customization:', error);
      return html;
    }
  }

  /**
   * Apply post customization to rendered HTML
   */
  async applyPostCustomization(html: string, postId: string): Promise<string> {
    try {
      const customization = await this.prisma.postCustomization.findUnique({
        where: { postId },
      });

      if (!customization) {
        return html;
      }

      return this.applyCustomizationStyles(html, customization);
    } catch (error) {
      console.error('Error applying post customization:', error);
      return html;
    }
  }

  /**
   * Apply customization styles to HTML
   * Uses validation to prevent XSS and injection attacks
   */
  private applyCustomizationStyles(html: string, customization: any): string {
    let result = html;

    // Apply layout class (validated)
    if (customization.layout && this.isValidClassName(customization.layout)) {
      const safeLayout = this.escapeHtmlAttribute(customization.layout);
      result = result.replace(/<main[^>]*>/, `<main class="layout-${safeLayout}">`);
    }

    // Apply background color (validated)
    if (customization.backgroundColor && this.isValidCssColor(customization.backgroundColor)) {
      const safeBgColor = this.escapeHtmlAttribute(customization.backgroundColor);
      const bgStyle = `background-color: ${safeBgColor};`;
      result = result.replace(/<main[^>]*>/, (match) => match.replace('>', ` style="${bgStyle}">`));
    }

    // Apply text color (validated)
    if (customization.textColor && this.isValidCssColor(customization.textColor)) {
      const safeTextColor = this.escapeHtmlAttribute(customization.textColor);
      const textStyle = `color: ${safeTextColor};`;
      result = result.replace(/<main[^>]*>/, (match) =>
        match.replace('>', ` style="${textStyle}">`),
      );
    }

    // Hide header if needed
    if (customization.showHeader === false) {
      result = result.replace(/<header[^>]*>[\s\S]*?<\/header>/i, '');
    }

    // Hide footer if needed
    if (customization.showFooter === false) {
      result = result.replace(/<footer[^>]*>[\s\S]*?<\/footer>/i, '');
    }

    // Hide sidebar if needed
    if (customization.showSidebar === false) {
      result = result.replace(/<aside[^>]*>[\s\S]*?<\/aside>/i, '');
    }

    // Inject custom CSS
    if (customization.customCSS) {
      const styleTag = `<style>${customization.customCSS}</style>`;
      result = result.replace('</head>', `${styleTag}</head>`);
    }

    return result;
  }

  /**
   * Generate customization CSS
   */
  generateCustomizationCSS(customization: any): string {
    let css = '';

    if (customization.layout) {
      css += `.layout-${customization.layout} { /* Layout styles */ }\n`;
    }

    if (customization.backgroundColor) {
      css += `main { background-color: ${customization.backgroundColor}; }\n`;
    }

    if (customization.textColor) {
      css += `main { color: ${customization.textColor}; }\n`;
    }

    if (customization.headerStyle) {
      css += `.site-header { ${customization.headerStyle} }\n`;
    }

    if (customization.footerStyle) {
      css += `.site-footer { ${customization.footerStyle} }\n`;
    }

    return css;
  }
}
