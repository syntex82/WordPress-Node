/**
 * Theme Renderer Service
 * Handles server-side rendering of theme templates
 */

import { Injectable } from '@nestjs/common';
import { ThemesService } from './themes.service';
import { SettingsService } from '../settings/settings.service';
import { MenusService } from '../menus/menus.service';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';

@Injectable()
export class ThemeRendererService {
  constructor(
    private themesService: ThemesService,
    private settingsService: SettingsService,
    private menusService: MenusService,
  ) {
    this.registerHelpers();
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers() {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date) => {
      return new Date(date).toLocaleDateString();
    });

    // Excerpt helper
    Handlebars.registerHelper('excerpt', (text: any, length: any = 150) => {
      if (!text) return '';
      const textStr = String(text).replace(/<[^>]*>/g, ''); // Strip HTML tags
      const lengthNum = typeof length === 'number' ? length : 150;
      if (textStr.length <= lengthNum) return textStr;
      return textStr.substring(0, lengthNum) + '...';
    });

    // Truncate helper (alias for excerpt, commonly used in themes)
    Handlebars.registerHelper('truncate', (text: any, length: any = 150) => {
      if (!text) return '';
      const textStr = String(text).replace(/<[^>]*>/g, ''); // Strip HTML tags
      const lengthNum = typeof length === 'number' ? length : 150;
      if (textStr.length <= lengthNum) return textStr;
      return textStr.substring(0, lengthNum) + '...';
    });

    // Substring helper
    Handlebars.registerHelper('substring', (text: string, start: number, end: number) => {
      if (!text) return '';
      return text.substring(start, end);
    });

    // Conditional helpers
    Handlebars.registerHelper('eq', (a, b) => a === b);
    Handlebars.registerHelper('ne', (a, b) => a !== b);

    // Math helpers
    Handlebars.registerHelper('subtract', (a, b) => {
      const numA = parseFloat(a) || 0;
      const numB = parseFloat(b) || 0;
      return (numA - numB).toFixed(2);
    });

    Handlebars.registerHelper('add', (a, b) => {
      const numA = parseInt(a) || 0;
      const numB = parseInt(b) || 0;
      return numA + numB;
    });

    // Comparison helpers
    Handlebars.registerHelper('gt', (a, b) => a > b);
    Handlebars.registerHelper('lt', (a, b) => a < b);
    Handlebars.registerHelper('gte', (a, b) => a >= b);
    Handlebars.registerHelper('lte', (a, b) => a <= b);

    // String helpers
    Handlebars.registerHelper('lowercase', (str) => {
      return str ? String(str).toLowerCase() : '';
    });

    Handlebars.registerHelper('uppercase', (str) => {
      return str ? String(str).toUpperCase() : '';
    });
  }

  /**
   * Register partials for a theme
   */
  private async registerPartials(themeSlug: string) {
    try {
      const partials = ['header', 'footer', 'sidebar'];

      for (const partial of partials) {
        try {
          const partialPath = this.themesService.getTemplatePath(themeSlug, partial);
          const partialContent = await fs.readFile(partialPath, 'utf-8');
          Handlebars.registerPartial(partial, partialContent);
        } catch (error) {
          // Partial doesn't exist, skip it
        }
      }
    } catch (error) {
      console.error('Error registering partials:', error);
    }
  }

  /**
   * Render a template with data
   */
  async render(template: string, data: any): Promise<string> {
    try {
      const activeTheme = await this.themesService.getActiveTheme();

      // Register partials for this theme
      await this.registerPartials(activeTheme.slug);

      const templatePath = this.themesService.getTemplatePath(activeTheme.slug, template);

      // Read template file
      const templateContent = await fs.readFile(templatePath, 'utf-8');

      // Compile template
      const compiledTemplate = Handlebars.compile(templateContent);

      // Get site settings
      const siteSettings = await this.settingsService.getSettings([
        'site_name',
        'site_description',
      ]);

      // Get menus
      const [headerMenu, footerMenu] = await Promise.all([
        this.menusService.findByLocation('header').catch(() => null),
        this.menusService.findByLocation('footer').catch(() => null),
      ]);

      // Add current year helper
      const currentYear = new Date().getFullYear();

      // Merge data with site settings and menus
      const renderData = {
        ...data,
        site: siteSettings,
        year: currentYear,
        menus: {
          header: headerMenu,
          footer: footerMenu,
        },
      };

      // Render template
      return compiledTemplate(renderData);
    } catch (error) {
      console.error('Error rendering template:', error);
      throw error;
    }
  }

  /**
   * Render home page
   */
  async renderHome(posts: any[], shopData?: { featuredProducts?: any[]; categories?: any[]; featuredCourses?: any[] }) {
    return this.render('home', {
      posts,
      featuredProducts: shopData?.featuredProducts || [],
      categories: shopData?.categories || [],
      featuredCourses: shopData?.featuredCourses || [],
    });
  }

  /**
   * Render single post
   */
  async renderPost(post: any) {
    return this.render('single-post', { post });
  }

  /**
   * Render single page
   */
  async renderPage(page: any) {
    const template = page.template || 'single-page';
    return this.render(template, { page });
  }

  /**
   * Render archive/listing
   */
  async renderArchive(posts: any[], pagination: any) {
    return this.render('archive', { posts, pagination });
  }

  /**
   * Render shop page
   */
  async renderShop(products: any[], categories: any[], pagination: any, activeCategory?: string | null) {
    return this.render('shop', {
      products,
      categories,
      pagination,
      activeCategory,
    });
  }

  /**
   * Render single product page
   */
  async renderProduct(product: any) {
    return this.render('single-product', { product });
  }

  /**
   * Render courses catalog page
   */
  async renderCourses(courses: any[], categories: string[], pagination: any, filters: { category?: string; level?: string; priceType?: string }) {
    return this.render('courses', {
      courses,
      categories,
      pagination,
      currentCategory: filters.category,
      currentLevel: filters.level,
      currentPriceType: filters.priceType,
    });
  }

  /**
   * Render single course landing page
   */
  async renderCourse(course: any, isEnrolled = false) {
    return this.render('single-course', { course, isEnrolled });
  }

  /**
   * Render certificate verification page
   */
  async renderCertificateVerify(result: any) {
    return this.render('certificate-verify', result);
  }

  /**
   * Render user profile page
   */
  async renderProfile(profile: any, stats: any) {
    return this.render('profile', {
      profile,
      stats,
      posts: profile.posts || [],
      courses: profile.instructedCourses || [],
      badges: profile.badges || [],
      certificates: profile.certificates || [],
    });
  }
}

