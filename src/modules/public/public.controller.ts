/**
 * Public Controller
 * Handles public-facing routes and renders theme templates
 */

import { Controller, Get, Post, Body, Param, Query, Req, Res, UseGuards, Inject, forwardRef } from '@nestjs/common';
import { Request, Response } from 'express';
import { join } from 'path';
import { PostsService } from '../content/services/posts.service';
import { PagesService } from '../content/services/pages.service';
import { ThemeRendererService } from '../themes/theme-renderer.service';
import { ProductsService } from '../shop/services/products.service';
import { CategoriesService } from '../shop/services/categories.service';
import { CoursesService } from '../lms/services/courses.service';
import { CertificatesService } from '../lms/services/certificates.service';
import { ProfilesService } from '../users/profiles.service';
import { AuthService } from '../auth/auth.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { RecommendationTrackingService } from '../recommendations/recommendation-tracking.service';
import { PrismaService } from '../../database/prisma.service';
import { DevelopersService } from '../marketplace/services/developers.service';
import { MarketplaceService } from '../themes/marketplace.service';
import { PluginMarketplaceService } from '../plugins/plugin-marketplace.service';
import { PostStatus } from '@prisma/client';
import { CourseLevel, CoursePriceType } from '../lms/dto/course.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';

@Controller()
export class PublicController {
  constructor(
    private postsService: PostsService,
    private pagesService: PagesService,
    private themeRenderer: ThemeRendererService,
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private coursesService: CoursesService,
    private certificatesService: CertificatesService,
    private profilesService: ProfilesService,
    private authService: AuthService,
    @Inject(forwardRef(() => RecommendationsService))
    private recommendationsService: RecommendationsService,
    @Inject(forwardRef(() => RecommendationTrackingService))
    private trackingService: RecommendationTrackingService,
    private prisma: PrismaService,
    @Inject(forwardRef(() => DevelopersService))
    private developersService: DevelopersService,
    @Inject(forwardRef(() => MarketplaceService))
    private themeMarketplaceService: MarketplaceService,
    @Inject(forwardRef(() => PluginMarketplaceService))
    private pluginMarketplaceService: PluginMarketplaceService,
  ) {}

  /**
   * Admin SPA fallback - serves index.html for /admin route
   * This enables the React app to handle its own routing
   * Must be before the catch-all page route
   */
  @Get('admin')
  async adminSpaRoot(@Res() res: Response) {
    const adminIndexPath = join(process.cwd(), 'admin', 'dist', 'index.html');
    res.sendFile(adminIndexPath);
  }

  /**
   * Admin SPA fallback - serves index.html for all /admin/* routes
   * This enables the React app to handle its own routing
   * Must be before the catch-all page route
   */
  @Get('admin/*')
  async adminSpaFallback(@Res() res: Response) {
    const adminIndexPath = join(process.cwd(), 'admin', 'dist', 'index.html');
    res.sendFile(adminIndexPath);
  }

  /**
   * Home page
   * GET /
   */
  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async home(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      // Fetch posts, featured products, and featured courses in parallel
      const [postsResult, productsResult, categories, coursesResult] = await Promise.all([
        this.postsService.findAll(1, 6, PostStatus.PUBLISHED),
        this.productsService.getActiveProducts({ limit: 8 }),
        this.categoriesService.findAll().catch(() => []),
        this.coursesService.findPublished({ limit: 6 }).catch(() => ({ courses: [] })),
      ]);

      const html = await this.themeRenderer.renderHome(
        postsResult.data,
        {
          featuredProducts: productsResult.products || [],
          categories: categories || [],
          featuredCourses: coursesResult.courses || [],
        },
        user,
      );
      res.send(html);
    } catch (error) {
      console.error('Error rendering home page:', error);
      res.status(500).send(`Error rendering home page: ${error.message}`);
    }
  }

  /**
   * LMS SPA fallback - serves admin panel for all /lms/* routes
   * This enables the React app to handle LMS routing
   * Must be before any catch-all routes
   */
  @Get('lms')
  async lmsRoot(@Res() res: Response) {
    res.redirect('http://localhost:5173/admin/lms');
  }

  @Get('lms/*path')
  async lmsFallback(@Res() res: Response) {
    // In development, redirect to Vite dev server (React app is at /admin/*)
    const originalUrl = res.req?.originalUrl || '/lms';
    res.redirect(`http://localhost:5173/admin${originalUrl}`);
  }

  /**
   * Learn course page - theme rendered learning player
   * GET /learn/:courseId
   */
  @Get('learn/:courseId')
  @UseGuards(OptionalJwtAuthGuard)
  async learnCourse(
    @Req() req: Request,
    @Param('courseId') courseId: string,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const html = await this.themeRenderer.renderLearn(courseId, user);
      res.send(html);
    } catch (error) {
      console.error('Error rendering learn page:', error);
      res.status(500).send(`Error rendering learn page: ${error.message}`);
    }
  }

  /**
   * My Courses page - theme rendered
   * GET /my-courses
   */
  @Get('my-courses')
  @UseGuards(OptionalJwtAuthGuard)
  async myCourses(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const html = await this.themeRenderer.renderMyCourses(user);
      res.send(html);
    } catch (error) {
      console.error('Error rendering my courses page:', error);
      res.status(500).send(`Error rendering my courses page: ${error.message}`);
    }
  }

  /**
   * My Account page - theme rendered
   * GET /my-account
   */
  @Get('my-account')
  @UseGuards(OptionalJwtAuthGuard)
  async myAccount(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const html = await this.themeRenderer.renderMyAccount(user);
      res.send(html);
    } catch (error) {
      console.error('Error rendering my account page:', error);
      res.status(500).send(`Error rendering my account page: ${error.message}`);
    }
  }

  /**
   * Orders page - redirects to my-account orders tab
   * GET /orders
   */
  @Get('orders')
  async ordersPage(@Res() res: Response) {
    res.redirect('/my-account#orders');
  }

  /**
   * Theme Designer page - visual theme customization
   * GET /theme-designer
   */
  @Get('theme-designer')
  @UseGuards(OptionalJwtAuthGuard)
  async themeDesigner(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      // Require admin role for theme designer
      if (!user || user.role !== 'ADMIN') {
        return res.redirect('/login?redirect=/theme-designer');
      }
      const html = await this.themeRenderer.renderThemeDesigner(user);
      res.send(html);
    } catch (error) {
      console.error('Error rendering theme designer:', error);
      res.status(500).send(`Error rendering theme designer: ${error.message}`);
    }
  }

  /**
   * Login page
   * GET /login
   */
  @Get('login')
  @UseGuards(OptionalJwtAuthGuard)
  async loginPage(@Req() req: Request, @Query('redirect') redirect: string, @Res() res: Response) {
    try {
      const user = (req as any).user;
      // If already logged in, redirect to home or specified redirect
      if (user) {
        return res.redirect(redirect || '/');
      }
      const html = await this.themeRenderer.renderLogin(redirect);
      res.send(html);
    } catch (error) {
      console.error('Error rendering login page:', error);
      res.status(500).send(`Error rendering login page: ${error.message}`);
    }
  }

  /**
   * Login form submission
   * POST /login
   */
  @Post('login')
  async loginSubmit(
    @Body() body: { email: string; password: string },
    @Query('redirect') redirect: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.authService.login({ email: body.email, password: body.password });
      // Set JWT as HTTP-only cookie for SSR pages
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      res.redirect(redirect || '/');
    } catch (_error) {
      const html = await this.themeRenderer.renderLogin(redirect, 'Invalid email or password');
      res.send(html);
    }
  }

  /**
   * Register page
   * GET /register
   */
  @Get('register')
  @UseGuards(OptionalJwtAuthGuard)
  async registerPage(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      // If already logged in, redirect to home
      if (user) {
        return res.redirect('/');
      }
      const html = await this.themeRenderer.renderRegister();
      res.send(html);
    } catch (error) {
      console.error('Error rendering register page:', error);
      res.status(500).send(`Error rendering register page: ${error.message}`);
    }
  }

  /**
   * Register form submission
   * POST /register
   */
  @Post('register')
  async registerSubmit(
    @Body() body: { name: string; email: string; password: string },
    @Res() res: Response,
  ) {
    try {
      await this.authService.register({
        name: body.name,
        email: body.email,
        password: body.password,
      });
      // Auto-login after registration
      const result = await this.authService.login({ email: body.email, password: body.password });
      res.cookie('access_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.redirect('/');
    } catch (error) {
      const html = await this.themeRenderer.renderRegister(error.message || 'Registration failed');
      res.send(html);
    }
  }

  /**
   * Logout
   * GET /logout
   */
  @Get('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('access_token');
    res.redirect('/');
  }

  /**
   * Cart page
   * GET /cart
   */
  @Get('cart')
  @UseGuards(OptionalJwtAuthGuard)
  async cartPage(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const html = await this.themeRenderer.renderCart(user);
      res.send(html);
    } catch (error) {
      console.error('Error rendering cart page:', error);
      res.status(500).send(`Error rendering cart page: ${error.message}`);
    }
  }

  /**
   * Checkout page
   * GET /checkout
   */
  @Get('checkout')
  @UseGuards(OptionalJwtAuthGuard)
  async checkoutPage(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const html = await this.themeRenderer.renderCheckout(user);
      res.send(html);
    } catch (error) {
      console.error('Error rendering checkout page:', error);
      res.status(500).send(`Error rendering checkout page: ${error.message}`);
    }
  }

  /**
   * Order success page
   * GET /order-success
   */
  @Get('order-success')
  @UseGuards(OptionalJwtAuthGuard)
  async orderSuccessPage(
    @Req() req: Request,
    @Query('order') orderId: string,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      let order: any = null;
      if (orderId) {
        order = await this.prisma.order.findUnique({
          where: { id: orderId },
          include: { items: true },
        });
      }
      const html = await this.themeRenderer.renderOrderSuccess(order, user);
      res.send(html);
    } catch (error) {
      console.error('Error rendering order success page:', error);
      res.status(500).send(`Error rendering order success page: ${error.message}`);
    }
  }

  /**
   * Blog archive
   * GET /blog
   */
  @Get('blog')
  @UseGuards(OptionalJwtAuthGuard)
  async blog(@Req() req: Request, @Query('page') page: string, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const currentPage = page ? parseInt(page) : 1;
      const result = await this.postsService.findAll(currentPage, 10, PostStatus.PUBLISHED);

      const pagination = {
        page: result.meta.page,
        totalPages: result.meta.totalPages,
        hasPrev: result.meta.page > 1,
        hasNext: result.meta.page < result.meta.totalPages,
        prevPage: result.meta.page - 1,
        nextPage: result.meta.page + 1,
      };

      const html = await this.themeRenderer.renderArchive(result.data, pagination, user);
      res.send(html);
    } catch (_error) {
      res.status(500).send('Error rendering blog archive');
    }
  }

  /**
   * Shop page
   * GET /shop
   */
  @Get('shop')
  @UseGuards(OptionalJwtAuthGuard)
  async shop(
    @Req() req: Request,
    @Query('page') page: string,
    @Query('category') category: string,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const currentPage = page ? parseInt(page) : 1;
      const limit = 12;

      // Get categories first (needed to look up categoryId from slug)
      const categories = await this.categoriesService.findAll().catch(() => []);

      // If category slug provided, find the category ID
      let categoryId: string | undefined;
      if (category) {
        const foundCategory = categories.find((c: any) => c.slug === category);
        categoryId = foundCategory?.id;
      }

      const productsResult = await this.productsService.getActiveProducts({
        page: currentPage,
        limit,
        categoryId,
      });

      const pagination = {
        page: currentPage,
        totalPages: productsResult.pagination?.pages || 1,
        hasPrev: currentPage > 1,
        hasNext: currentPage < (productsResult.pagination?.pages || 1),
        prevPage: currentPage - 1,
        nextPage: currentPage + 1,
      };

      const html = await this.themeRenderer.renderShop(
        productsResult.products || [],
        categories || [],
        pagination,
        category || null,
        user,
      );
      res.send(html);
    } catch (error) {
      console.error('Error rendering shop page:', error);
      res.status(500).send(`Error rendering shop page: ${error.message}`);
    }
  }

  /**
   * Single product page
   * GET /shop/product/:slug
   */
  @Get('shop/product/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async product(@Req() req: Request, @Param('slug') slug: string, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const product = await this.productsService.findBySlug(slug);

      if (!product || product.status !== 'ACTIVE') {
        res.status(404).send('Product not found');
        return;
      }

      // Track this view for recommendations
      await this.trackingService.trackInteraction({
        contentType: 'product',
        contentId: product.id,
        interactionType: 'view',
        userId: user?.id,
        sessionId: req.sessionID,
      });

      // Get related products for recommendations
      const relatedProducts = await this.recommendationsService.getRelatedProducts(product.id, 4, user?.id);
      const productWithRecommendations = {
        ...product,
        relatedProducts: relatedProducts.items,
      };

      const html = await this.themeRenderer.renderProduct(productWithRecommendations, user);
      res.send(html);
    } catch (_error) {
      res.status(404).send('Product not found');
    }
  }

  /**
   * Courses catalog
   * GET /courses
   */
  @Get('courses')
  @UseGuards(OptionalJwtAuthGuard)
  async courses(
    @Req() req: Request,
    @Query('page') page: string,
    @Query('category') category: string,
    @Query('level') level: string,
    @Query('priceType') priceType: string,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const currentPage = page ? parseInt(page) : 1;
      const limit = 12;

      const coursesResult = await this.coursesService.findPublished({
        page: currentPage,
        limit,
        category: category || undefined,
        level: level ? (level as CourseLevel) : undefined,
        priceType: priceType ? (priceType as CoursePriceType) : undefined,
      });

      const categoriesList = await this.coursesService.getCategories();

      const pagination = {
        page: currentPage,
        pages: coursesResult.pagination?.pages || 1,
        hasPrev: currentPage > 1,
        hasNext: currentPage < (coursesResult.pagination?.pages || 1),
      };

      const html = await this.themeRenderer.renderCourses(
        coursesResult.courses || [],
        categoriesList.filter((c): c is string => c !== null),
        pagination,
        { category, level, priceType },
        user,
      );
      res.send(html);
    } catch (error) {
      console.error('Error rendering courses page:', error);
      res.status(500).send(`Error rendering courses page: ${error.message}`);
    }
  }

  /**
   * Single course landing page
   * GET /courses/:slug
   */
  @Get('courses/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async course(@Req() req: Request, @Param('slug') slug: string, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const course = await this.coursesService.findBySlug(slug);

      if (!course || course.status !== 'PUBLISHED') {
        res.status(404).send('Course not found');
        return;
      }

      const html = await this.themeRenderer.renderCourse(course, false, user);
      res.send(html);
    } catch (_error) {
      res.status(404).send('Course not found');
    }
  }

  /**
   * Course enrollment redirect
   * GET /courses/:slug/enroll
   * Redirects to admin app for enrollment process
   */
  @Get('courses/:slug/enroll')
  async enrollCourse(@Param('slug') slug: string, @Res() res: Response) {
    try {
      const course = await this.coursesService.findBySlug(slug);

      if (!course || course.status !== 'PUBLISHED') {
        res.status(404).send('Course not found');
        return;
      }

      // Redirect to the React app for the enrollment flow
      // For free courses, they'll be enrolled directly
      // For paid courses, they'll be redirected to checkout
      res.redirect(`http://localhost:5173/admin/lms/course/${slug}?enroll=true`);
    } catch (_error) {
      res.status(404).send('Course not found');
    }
  }

  /**
   * Certificate verification page
   * GET /verify/:hash
   */
  @Get('verify/:hash')
  async verifyCertificate(@Param('hash') hash: string, @Res() res: Response) {
    try {
      const result = await this.certificatesService.verify(hash);
      const html = await this.themeRenderer.renderCertificateVerify(result);
      res.send(html);
    } catch (_error) {
      res.status(500).send('Error verifying certificate');
    }
  }

  /**
   * Single post
   * GET /post/:slug
   */
  @Get('post/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async post(@Req() req: Request, @Param('slug') slug: string, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const post = await this.postsService.findBySlug(slug);

      if (post.status !== PostStatus.PUBLISHED) {
        res.status(404).send('Post not found');
        return;
      }

      // Track this view for recommendations
      await this.trackingService.trackInteraction({
        contentType: 'post',
        contentId: post.id,
        interactionType: 'view',
        userId: user?.id,
        sessionId: req.sessionID,
      });

      // Get related posts for recommendations
      const relatedPosts = await this.recommendationsService.getRelatedPosts(post.id, 4, user?.id);
      const postWithRecommendations = {
        ...post,
        relatedPosts: relatedPosts.items,
      };

      const html = await this.themeRenderer.renderPost(postWithRecommendations, user);
      res.send(html);
    } catch (_error) {
      res.status(404).send('Post not found');
    }
  }

  /**
   * User profile page
   * GET /u/:identifier (username or ID)
   */
  @Get('u/:identifier')
  @UseGuards(OptionalJwtAuthGuard)
  async userProfile(
    @Req() req: Request,
    @Param('identifier') identifier: string,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const profile = await this.profilesService.getPublicProfile(identifier);

      if (!profile || !profile.isPublic) {
        res.status(404).send('Profile not found');
        return;
      }

      const stats = await this.profilesService.getStats(profile.id);
      const html = await this.themeRenderer.renderProfile(profile, stats, user);
      res.send(html);
    } catch (error) {
      console.error('Error rendering profile:', error);
      res.status(404).send('Profile not found');
    }
  }

  // ============================================
  // DEVELOPER MARKETPLACE ROUTES
  // ============================================

  /**
   * Hire a Developer page - browse all developers
   * GET /hire-developer
   */
  @Get('hire-developer')
  @UseGuards(OptionalJwtAuthGuard)
  async hireDeveloper(
    @Req() req: Request,
    @Res() res: Response,
    @Query('category') category?: string,
    @Query('skills') skills?: string,
    @Query('minRate') minRate?: string,
    @Query('maxRate') maxRate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
  ) {
    try {
      const user = (req as any).user;
      const result = await this.developersService.findAll({
        status: 'ACTIVE' as any,
        category: category as any,
        skills: skills ? skills.split(',') : undefined,
        minRate: minRate ? parseFloat(minRate) : undefined,
        maxRate: maxRate ? parseFloat(maxRate) : undefined,
        search,
        page: page ? parseInt(page) : 1,
        limit: 12,
      });

      const categories = [
        { value: 'FRONTEND', label: 'Frontend Developer' },
        { value: 'BACKEND', label: 'Backend Developer' },
        { value: 'FULLSTACK', label: 'Full-Stack Developer' },
        { value: 'WORDPRESS', label: 'WordPress Developer' },
        { value: 'MOBILE', label: 'Mobile Developer' },
        { value: 'DEVOPS', label: 'DevOps Engineer' },
        { value: 'DESIGN', label: 'UI/UX Designer' },
        { value: 'DATABASE', label: 'Database Expert' },
        { value: 'SECURITY', label: 'Security Specialist' },
      ];

      const html = await this.themeRenderer.render('hire-developer', {
        title: 'Hire a Developer',
        developers: result.developers,
        pagination: result.pagination,
        categories,
        filters: { category, skills, minRate, maxRate, search },
        user,
      });
      res.send(html);
    } catch (error) {
      console.error('Error rendering hire-developer page:', error);
      res.status(500).send('Error loading page');
    }
  }

  /**
   * Developer Marketplace - categorized view
   * GET /developer-marketplace
   */
  @Get('developer-marketplace')
  @UseGuards(OptionalJwtAuthGuard)
  async developerMarketplace(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;

      // Get featured developers
      const featured = await this.developersService.findAll({
        status: 'ACTIVE' as any,
        sortBy: 'rating',
        limit: 6,
      });

      // Get developers by category
      const categories = ['FRONTEND', 'BACKEND', 'FULLSTACK', 'MOBILE', 'DEVOPS', 'DESIGN'];
      const byCategory = await Promise.all(
        categories.map(async (cat) => ({
          category: cat,
          label: cat.charAt(0) + cat.slice(1).toLowerCase().replace('_', ' '),
          developers: (await this.developersService.findAll({
            status: 'ACTIVE' as any,
            category: cat as any,
            limit: 4,
          })).developers,
        })),
      );

      const html = await this.themeRenderer.render('developer-marketplace', {
        title: 'Developer Marketplace',
        featured: featured.developers,
        byCategory: byCategory.filter((c) => c.developers.length > 0),
        user,
      });
      res.send(html);
    } catch (error) {
      console.error('Error rendering developer-marketplace:', error);
      res.status(500).send('Error loading page');
    }
  }

  /**
   * Developer Profile page
   * GET /developer/:slug
   */
  @Get('developer/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async developerProfile(@Req() req: Request, @Param('slug') slug: string, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const developer = await this.developersService.findBySlug(slug);

      const html = await this.themeRenderer.render('developer-profile', {
        title: developer.displayName,
        developer,
        user,
      });
      res.send(html);
    } catch (error) {
      console.error('Error rendering developer profile:', error);
      res.status(404).send('Developer not found');
    }
  }

  // ============================================
  // THEMES & PLUGINS MARKETPLACE ROUTES
  // ============================================

  /**
   * Marketplace landing page - browse themes and plugins
   * GET /marketplace
   */
  @Get('marketplace')
  @UseGuards(OptionalJwtAuthGuard)
  async marketplace(
    @Req() req: Request,
    @Res() res: Response,
    @Query('tab') tab?: string,
  ) {
    try {
      const user = (req as any).user;
      const activeTab = tab === 'plugins' ? 'plugins' : 'themes';

      // Get featured themes and plugins
      const [featuredThemes, featuredPlugins, themeStats, pluginStats] = await Promise.all([
        this.themeMarketplaceService.getFeatured(6),
        this.pluginMarketplaceService.getFeatured(6),
        this.themeMarketplaceService.getStats(),
        this.pluginMarketplaceService.getStats(),
      ]);

      const html = await this.themeRenderer.render('marketplace', {
        title: 'Themes & Plugins Marketplace',
        activeTab,
        featuredThemes,
        featuredPlugins,
        stats: {
          themes: themeStats,
          plugins: pluginStats,
        },
        user,
      });
      res.send(html);
    } catch (error) {
      console.error('Error rendering marketplace:', error);
      res.status(500).send('Error loading marketplace');
    }
  }

  /**
   * Browse themes
   * GET /marketplace/themes
   */
  @Get('marketplace/themes')
  @UseGuards(OptionalJwtAuthGuard)
  async marketplaceThemes(
    @Req() req: Request,
    @Res() res: Response,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
  ) {
    try {
      const user = (req as any).user;

      const [themes, categories] = await Promise.all([
        this.themeMarketplaceService.findAll({
          category,
          search,
          status: 'approved',
          sortBy: (sortBy as any) || 'downloads',
          page: page ? parseInt(page) : 1,
          limit: 12,
        }),
        this.themeMarketplaceService.getCategories(),
      ]);

      const html = await this.themeRenderer.render('marketplace-themes', {
        title: 'Browse Themes',
        themes: themes.themes,
        pagination: themes.pagination,
        categories,
        filters: { category, search, sortBy },
        user,
      });
      res.send(html);
    } catch (error) {
      console.error('Error rendering themes marketplace:', error);
      res.status(500).send('Error loading themes');
    }
  }

  /**
   * Single theme detail page
   * GET /marketplace/themes/:slug
   */
  @Get('marketplace/themes/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async marketplaceThemeDetail(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const theme = await this.themeMarketplaceService.findBySlug(slug);

      const html = await this.themeRenderer.render('marketplace-theme-detail', {
        title: theme.name,
        theme,
        user,
      });
      res.send(html);
    } catch (error) {
      console.error('Error rendering theme detail:', error);
      res.status(404).send('Theme not found');
    }
  }

  /**
   * Browse plugins
   * GET /marketplace/plugins
   */
  @Get('marketplace/plugins')
  @UseGuards(OptionalJwtAuthGuard)
  async marketplacePlugins(
    @Req() req: Request,
    @Res() res: Response,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: string,
  ) {
    try {
      const user = (req as any).user;

      const [plugins, categories] = await Promise.all([
        this.pluginMarketplaceService.findAll({
          category,
          search,
          status: 'approved',
          sortBy: (sortBy as any) || 'downloads',
          page: page ? parseInt(page) : 1,
          limit: 12,
        }),
        this.pluginMarketplaceService.getCategories(),
      ]);

      const html = await this.themeRenderer.render('marketplace-plugins', {
        title: 'Browse Plugins',
        plugins: plugins.plugins,
        pagination: plugins.pagination,
        categories,
        filters: { category, search, sortBy },
        user,
      });
      res.send(html);
    } catch (error) {
      console.error('Error rendering plugins marketplace:', error);
      res.status(500).send('Error loading plugins');
    }
  }

  /**
   * Single plugin detail page
   * GET /marketplace/plugins/:slug
   */
  @Get('marketplace/plugins/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  async marketplacePluginDetail(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Res() res: Response,
  ) {
    try {
      const user = (req as any).user;
      const plugin = await this.pluginMarketplaceService.findBySlug(slug);

      const html = await this.themeRenderer.render('marketplace-plugin-detail', {
        title: plugin.name,
        plugin,
        user,
      });
      res.send(html);
    } catch (error) {
      console.error('Error rendering plugin detail:', error);
      res.status(404).send('Plugin not found');
    }
  }

  /**
   * Developer requirements and guidelines page
   * GET /marketplace/developer-guidelines
   */
  @Get('marketplace/developer-guidelines')
  @UseGuards(OptionalJwtAuthGuard)
  async developerGuidelines(@Req() req: Request, @Res() res: Response) {
    try {
      const user = (req as any).user;

      const html = await this.themeRenderer.render('marketplace-guidelines', {
        title: 'Developer Requirements & Guidelines',
        user,
      });
      res.send(html);
    } catch (error) {
      console.error('Error rendering developer guidelines:', error);
      res.status(500).send('Error loading guidelines');
    }
  }

  /**
   * Single page
   * GET /:slug
   */
  @Get(':slug')
  @UseGuards(OptionalJwtAuthGuard)
  async page(@Req() req: Request, @Param('slug') slug: string, @Res() res: Response) {
    try {
      const user = (req as any).user;
      const page = await this.pagesService.findBySlug(slug);

      if (page.status !== PostStatus.PUBLISHED) {
        res.status(404).send('Page not found');
        return;
      }

      const html = await this.themeRenderer.renderPage(page, user);
      res.send(html);
    } catch (_error) {
      res.status(404).send('Page not found');
    }
  }
}
