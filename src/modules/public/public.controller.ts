/**
 * Public Controller
 * Handles public-facing routes and renders theme templates
 */

import { Controller, Get, Post, Body, Param, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Request, Response } from 'express';
import { PostsService } from '../content/services/posts.service';
import { PagesService } from '../content/services/pages.service';
import { ThemeRendererService } from '../themes/theme-renderer.service';
import { ProductsService } from '../shop/services/products.service';
import { CategoriesService } from '../shop/services/categories.service';
import { CoursesService } from '../lms/services/courses.service';
import { CertificatesService } from '../lms/services/certificates.service';
import { ProfilesService } from '../users/profiles.service';
import { AuthService } from '../auth/auth.service';
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
  ) {}

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

      const html = await this.themeRenderer.renderHome(postsResult.data, {
        featuredProducts: productsResult.products || [],
        categories: categories || [],
        featuredCourses: coursesResult.courses || [],
      }, user);
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
   * Learn course page - redirects to React LMS player
   * GET /learn/:courseId
   */
  @Get('learn/:courseId')
  async learnCourse(@Param('courseId') courseId: string, @Res() res: Response) {
    res.redirect(`http://localhost:5173/admin/lms/learn/${courseId}`);
  }

  /**
   * My Courses page - redirects to React LMS student dashboard
   * GET /my-courses
   */
  @Get('my-courses')
  async myCourses(@Res() res: Response) {
    res.redirect('http://localhost:5173/admin/lms/dashboard');
  }

  /**
   * My Account page - redirects to React profile settings
   * GET /my-account
   */
  @Get('my-account')
  async myAccount(@Res() res: Response) {
    res.redirect('http://localhost:5173/admin/settings/profile');
  }

  /**
   * Orders page - redirects to React orders list
   * GET /orders
   */
  @Get('orders')
  async ordersPage(@Res() res: Response) {
    res.redirect('http://localhost:5173/admin/shop/orders');
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
    } catch (error) {
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
      await this.authService.register({ name: body.name, email: body.email, password: body.password });
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
    } catch (error) {
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

      const html = await this.themeRenderer.renderProduct(product, user);
      res.send(html);
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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

      const html = await this.themeRenderer.renderPost(post, user);
      res.send(html);
    } catch (error) {
      res.status(404).send('Post not found');
    }
  }

  /**
   * User profile page
   * GET /u/:identifier (username or ID)
   */
  @Get('u/:identifier')
  @UseGuards(OptionalJwtAuthGuard)
  async userProfile(@Req() req: Request, @Param('identifier') identifier: string, @Res() res: Response) {
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
    } catch (error) {
      res.status(404).send('Page not found');
    }
  }
}
