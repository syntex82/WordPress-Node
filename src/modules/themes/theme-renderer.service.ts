/**
 * Theme Renderer Service
 * Handles server-side rendering of theme templates
 * Includes subscription context for premium feature gating
 */

import { Injectable } from '@nestjs/common';
import { ThemesService } from './themes.service';
import { SettingsService } from '../settings/settings.service';
import { MenusService } from '../menus/menus.service';
import { CustomizationRendererService } from './customization-renderer.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { parseUserAgent, getDeviceClasses, DeviceInfo } from '../../utils/device-detection';
import * as Handlebars from 'handlebars';
import * as fs from 'fs/promises';

export interface RenderOptions {
  userAgent?: string;
}

@Injectable()
export class ThemeRendererService {
  constructor(
    private themesService: ThemesService,
    private settingsService: SettingsService,
    private menusService: MenusService,
    private customizationRenderer: CustomizationRendererService,
    private subscriptionsService: SubscriptionsService,
  ) {
    this.registerHelpers();
    this.registerSubscriptionHelpers();
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

    // Logical helpers
    Handlebars.registerHelper('or', (...args) => {
      // Remove the options object (last argument from Handlebars)
      args.pop();
      return args.some((arg) => !!arg);
    });

    Handlebars.registerHelper('and', (...args) => {
      // Remove the options object (last argument from Handlebars)
      args.pop();
      return args.every((arg) => !!arg);
    });

    Handlebars.registerHelper('not', (value) => !value);

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

    // JSON helper - serialize data for JavaScript
    Handlebars.registerHelper('json', (context) => {
      return JSON.stringify(context || []);
    });
  }

  /**
   * Register subscription-related Handlebars helpers
   */
  private registerSubscriptionHelpers() {
    // Check if site has a specific feature enabled
    Handlebars.registerHelper('hasFeature', function (this: any, feature: string, options: any) {
      const subscription = this.subscription;
      if (!subscription || !subscription.features) {
        return options.inverse ? options.inverse(this) : '';
      }
      const hasIt = subscription.features.includes(feature);
      return hasIt ? options.fn(this) : options.inverse ? options.inverse(this) : '';
    });

    // Check if site has a specific plan or higher
    Handlebars.registerHelper('hasPlan', function (this: any, planTier: string, options: any) {
      const subscription = this.subscription;
      const planHierarchy = ['free', 'starter', 'professional', 'enterprise'];
      const currentPlanIndex = subscription
        ? planHierarchy.indexOf(subscription.planTier?.toLowerCase() || 'free')
        : 0;
      const requiredPlanIndex = planHierarchy.indexOf(planTier.toLowerCase());
      const hasIt = currentPlanIndex >= requiredPlanIndex;
      return hasIt ? options.fn(this) : options.inverse ? options.inverse(this) : '';
    });

    // Check if site is on free plan (show upgrade prompts)
    Handlebars.registerHelper('isFreePlan', function (this: any, options: any) {
      const subscription = this.subscription;
      const isFree =
        !subscription || subscription.planTier?.toLowerCase() === 'free' || !subscription.isActive;
      return isFree ? options.fn(this) : options.inverse ? options.inverse(this) : '';
    });

    // Check if subscription is active
    Handlebars.registerHelper('hasActiveSubscription', function (this: any, options: any) {
      const subscription = this.subscription;
      const isActive = subscription && subscription.isActive;
      return isActive ? options.fn(this) : options.inverse ? options.inverse(this) : '';
    });

    // Get current plan name
    Handlebars.registerHelper('currentPlan', function (this: any) {
      const subscription = this.subscription;
      return subscription?.planName || 'Free';
    });

    // Format price with currency
    Handlebars.registerHelper('formatPrice', (price: number, currency = 'USD') => {
      if (typeof price !== 'number') return '$0';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
      }).format(price / 100); // Stripe uses cents
    });

    // Check if a plan is the current plan
    Handlebars.registerHelper('isCurrentPlan', function (this: any, planId: string) {
      const subscription = this.subscription;
      return subscription?.planId === planId;
    });

    // Get upgrade URL for a plan
    Handlebars.registerHelper('upgradeUrl', (planId: string) => {
      return `/admin/pricing?plan=${planId}`;
    });
  }

  /**
   * Register partials for a theme
   */
  private async registerPartials(themeSlug: string) {
    try {
      // Partials in templates folder (legacy)
      const templatePartials = ['header', 'footer', 'sidebar'];
      for (const partial of templatePartials) {
        try {
          const partialPath = this.themesService.getTemplatePath(themeSlug, partial);
          const partialContent = await fs.readFile(partialPath, 'utf-8');
          Handlebars.registerPartial(partial, partialContent);
        } catch (_error) {
          // Partial doesn't exist, skip it
        }
      }

      // Partials in partials folder
      const partialsDir = this.themesService.getPartialsPath(themeSlug);
      try {
        const files = await fs.readdir(partialsDir);
        for (const file of files) {
          if (file.endsWith('.hbs')) {
            const partialName = file.replace('.hbs', '');
            const partialPath = `${partialsDir}/${file}`;
            const partialContent = await fs.readFile(partialPath, 'utf-8');
            Handlebars.registerPartial(partialName, partialContent);
          }
        }
      } catch (_error) {
        // Partials directory doesn't exist, skip
      }
    } catch (error) {
      console.error('Error registering partials:', error);
    }
  }

  /**
   * Render a template with data
   */
  async render(
    template: string,
    data: any,
    user?: { id: string; role: string } | null,
    options?: RenderOptions,
  ): Promise<string> {
    try {
      const activeTheme = await this.themesService.getActiveTheme();

      // Register partials for this theme
      await this.registerPartials(activeTheme.slug);

      // Try active theme first, fall back to default theme
      let templatePath = this.themesService.getTemplatePath(activeTheme.slug, template);
      let templateContent: string;

      try {
        templateContent = await fs.readFile(templatePath, 'utf-8');
      } catch {
        // Template not found in active theme, try default theme
        if (activeTheme.slug !== 'default') {
          templatePath = this.themesService.getTemplatePath('default', template);
          templateContent = await fs.readFile(templatePath, 'utf-8');
          // Also register default theme partials for fallback templates
          await this.registerPartials('default');
        } else {
          throw new Error(`Template "${template}" not found`);
        }
      }

      // Compile template
      const compiledTemplate = Handlebars.compile(templateContent);

      // Get site settings
      const siteSettings = await this.settingsService.getSettings([
        'site_name',
        'site_description',
      ]);

      // Get menus and subscription data in parallel
      const [headerMenu, footerMenu, subscriptionData] = await Promise.all([
        this.menusService.findByLocation('header').catch(() => null),
        this.menusService.findByLocation('footer').catch(() => null),
        this.getSubscriptionContext(),
      ]);

      // Add current year helper
      const currentYear = new Date().getFullYear();

      // Check if user can customize (ADMIN or EDITOR)
      const canCustomize = user && (user.role === 'ADMIN' || user.role === 'EDITOR');

      // Parse device info from user agent
      const device: DeviceInfo = parseUserAgent(options?.userAgent);
      const deviceClasses = getDeviceClasses(device);

      // Merge data with site settings and menus
      const renderData = {
        ...data,
        site: siteSettings,
        year: currentYear,
        themeSlug: activeTheme.slug,
        menus: {
          header: headerMenu,
          footer: footerMenu,
        },
        // Device detection info for responsive templates
        device,
        deviceClasses,
        // Subscription data for premium features and upgrade prompts
        subscription: subscriptionData.currentSubscription,
        plans: subscriptionData.plans,
        // User info for templates (header user menu, etc.)
        // Use provided user parameter, or fall back to data.user if passed in data
        user: user
          ? {
              id: user.id,
              role: user.role,
              name: (user as any).name || (user as any).email || 'User',
              email: (user as any).email,
            }
          : data.user || null,
        // User info for admin bar / customization (canCustomize flag)
        currentUser: user
          ? {
              id: user.id,
              role: user.role,
              canCustomize,
            }
          : null,
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
  async renderHome(
    posts: any[],
    shopData?: { featuredProducts?: any[]; categories?: any[]; featuredCourses?: any[] },
    user?: { id: string; role: string } | null,
  ) {
    return this.render(
      'home',
      {
        posts,
        featuredProducts: shopData?.featuredProducts || [],
        categories: shopData?.categories || [],
        featuredCourses: shopData?.featuredCourses || [],
      },
      user,
    );
  }

  /**
   * Render single post
   */
  async renderPost(post: any, user?: { id: string; role: string } | null) {
    let html = await this.render('single-post', { post }, user);
    // Apply post customizations
    html = await this.customizationRenderer.applyPostCustomization(html, post.id);
    return html;
  }

  /**
   * Render single page
   */
  async renderPage(page: any, user?: { id: string; role: string } | null) {
    const template = page.template || 'single-page';
    let html = await this.render(template, { page }, user);
    // Apply page customizations
    html = await this.customizationRenderer.applyPageCustomization(html, page.id);
    return html;
  }

  /**
   * Render archive/listing
   */
  async renderArchive(
    posts: any[],
    pagination: any,
    user?: { id: string; role: string } | null,
    archiveTitle = 'Blog',
    archiveDescription = 'Latest posts and articles',
  ) {
    return this.render('archive', { posts, pagination, archiveTitle, archiveDescription }, user);
  }

  /**
   * Render shop page
   */
  async renderShop(
    products: any[],
    categories: any[],
    pagination: any,
    activeCategory?: string | null,
    user?: { id: string; role: string } | null,
  ) {
    return this.render(
      'shop',
      {
        products,
        categories,
        pagination,
        activeCategory,
      },
      user,
    );
  }

  /**
   * Render single product page
   */
  async renderProduct(product: any, user?: { id: string; role: string } | null) {
    return this.render('single-product', { product }, user);
  }

  /**
   * Render courses catalog page
   */
  async renderCourses(
    courses: any[],
    categories: string[],
    pagination: any,
    filters: { category?: string; level?: string; priceType?: string },
    user?: { id: string; role: string } | null,
  ) {
    return this.render(
      'courses',
      {
        courses,
        categories,
        pagination,
        currentCategory: filters.category,
        currentLevel: filters.level,
        currentPriceType: filters.priceType,
      },
      user,
    );
  }

  /**
   * Render single course landing page
   */
  async renderCourse(course: any, isEnrolled = false, user?: { id: string; role: string } | null) {
    return this.render('single-course', { course, isEnrolled }, user);
  }

  /**
   * Render certificate verification page
   */
  async renderCertificateVerify(result: any, user?: { id: string; role: string } | null) {
    return this.render('certificate-verify', result, user);
  }

  /**
   * Render user profile page
   */
  async renderProfile(profile: any, stats: any, user?: { id: string; role: string } | null) {
    return this.render(
      'profile',
      {
        profile,
        stats,
        posts: profile.posts || [],
        courses: profile.instructedCourses || [],
        badges: profile.badges || [],
        certificates: profile.certificates || [],
      },
      user,
    );
  }

  /**
   * Render login page
   */
  async renderLogin(
    redirect?: string,
    error?: string,
    user?: { id: string; role: string; name?: string } | null,
  ) {
    return this.render(
      'login',
      {
        redirect,
        error,
      },
      user,
    );
  }

  /**
   * Render register page
   */
  async renderRegister(error?: string, user?: { id: string; role: string; name?: string } | null) {
    return this.render(
      'register',
      {
        error,
      },
      user,
    );
  }

  /**
   * Render cart page
   */
  async renderCart(user?: { id: string; role: string; name?: string } | null) {
    return this.render(
      'cart',
      {
        user,
      },
      user,
    );
  }

  /**
   * Render checkout page
   */
  async renderCheckout(user?: { id: string; role: string; name?: string } | null) {
    return this.render(
      'checkout',
      {
        user,
      },
      user,
    );
  }

  /**
   * Render my account page
   */
  async renderMyAccount(user?: { id: string; role: string; name?: string; email?: string } | null) {
    return this.render(
      'my-account',
      {
        user,
      },
      user,
    );
  }

  /**
   * Render my courses page
   */
  async renderMyCourses(user?: { id: string; role: string; name?: string } | null) {
    return this.render(
      'my-courses',
      {
        user,
      },
      user,
    );
  }

  /**
   * Render course learning page
   */
  async renderLearn(courseId: string, user?: { id: string; role: string; name?: string } | null) {
    return this.render(
      'learn',
      {
        courseId,
        user,
      },
      user,
    );
  }

  /**
   * Render theme designer page
   */
  async renderThemeDesigner(user?: { id: string; role: string; name?: string } | null) {
    return this.render(
      'theme-designer',
      {
        user,
        isAdmin: user?.role === 'ADMIN',
      },
      user,
    );
  }

  /**
   * Render order success page
   */
  async renderOrderSuccess(order: any, user?: { id: string; role: string; name?: string } | null) {
    return this.render(
      'order-success',
      {
        order,
        user,
      },
      user,
    );
  }

  /**
   * Get subscription context for templates
   * Returns current subscription status and available plans
   */
  private async getSubscriptionContext(): Promise<{
    currentSubscription: any;
    plans: any[];
  }> {
    try {
      // Get all available plans
      const plans = await this.subscriptionsService.getPlans();

      // Get site owner's current subscription (first admin user)
      // In a multi-tenant setup, this would be based on domain/tenant
      const currentSubscription = await this.subscriptionsService.getSiteSubscription();

      return {
        currentSubscription: currentSubscription
          ? {
              planId: currentSubscription.planId,
              planName: currentSubscription.plan?.name || 'Free',
              planTier: currentSubscription.plan?.slug?.toUpperCase() || 'FREE',
              isActive: currentSubscription.status === 'ACTIVE',
              features: currentSubscription.plan?.features || [],
              expiresAt: currentSubscription.currentPeriodEnd,
            }
          : {
              planId: null,
              planName: 'Free',
              planTier: 'FREE',
              isActive: false,
              features: [],
              expiresAt: null,
            },
        plans: plans.map((plan) => ({
          id: plan.id,
          name: plan.name,
          slug: plan.slug,
          description: plan.description,
          monthlyPrice: plan.monthlyPrice,
          yearlyPrice: plan.yearlyPrice,
          features: plan.features,
          maxUsers: plan.maxUsers,
          maxStorageMb: plan.maxStorageMb,
          maxCourses: plan.maxCourses,
          maxProducts: plan.maxProducts,
          isFeatured: plan.isFeatured,
          badgeText: plan.badgeText,
        })),
      };
    } catch (error) {
      console.error('Error fetching subscription context:', error);
      // Return default free plan context on error
      return {
        currentSubscription: {
          planId: null,
          planName: 'Free',
          planTier: 'FREE',
          isActive: false,
          features: [],
          expiresAt: null,
        },
        plans: [],
      };
    }
  }
}
