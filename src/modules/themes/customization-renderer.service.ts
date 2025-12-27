import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class CustomizationRendererService {
  constructor(private readonly prisma: PrismaService) {}

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
   */
  private applyCustomizationStyles(html: string, customization: any): string {
    let result = html;

    // Apply layout class
    if (customization.layout) {
      result = result.replace(/<main[^>]*>/, `<main class="layout-${customization.layout}">`);
    }

    // Apply background color
    if (customization.backgroundColor) {
      const bgStyle = `background-color: ${customization.backgroundColor};`;
      result = result.replace(/<main[^>]*>/, (match) => match.replace('>', ` style="${bgStyle}">`));
    }

    // Apply text color
    if (customization.textColor) {
      const textStyle = `color: ${customization.textColor};`;
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
