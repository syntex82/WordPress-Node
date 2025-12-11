/**
 * Public Controller
 * Handles public-facing routes and renders theme templates
 */

import { Controller, Get, Param, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { PostsService } from '../content/services/posts.service';
import { PagesService } from '../content/services/pages.service';
import { ThemeRendererService } from '../themes/theme-renderer.service';
import { PostStatus } from '@prisma/client';

@Controller()
export class PublicController {
  constructor(
    private postsService: PostsService,
    private pagesService: PagesService,
    private themeRenderer: ThemeRendererService,
  ) {}

  /**
   * Home page
   * GET /
   */
  @Get()
  async home(@Res() res: Response) {
    try {
      const { data: posts } = await this.postsService.findAll(1, 10, PostStatus.PUBLISHED);
      const html = await this.themeRenderer.renderHome(posts);
      res.send(html);
    } catch (error) {
      console.error('Error rendering home page:', error);
      res.status(500).send(`Error rendering home page: ${error.message}`);
    }
  }

  /**
   * Blog archive
   * GET /blog
   */
  @Get('blog')
  async blog(@Query('page') page: string, @Res() res: Response) {
    try {
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

      const html = await this.themeRenderer.renderArchive(result.data, pagination);
      res.send(html);
    } catch (error) {
      res.status(500).send('Error rendering blog archive');
    }
  }

  /**
   * Single post
   * GET /post/:slug
   */
  @Get('post/:slug')
  async post(@Param('slug') slug: string, @Res() res: Response) {
    try {
      const post = await this.postsService.findBySlug(slug);
      
      if (post.status !== PostStatus.PUBLISHED) {
        res.status(404).send('Post not found');
        return;
      }

      const html = await this.themeRenderer.renderPost(post);
      res.send(html);
    } catch (error) {
      res.status(404).send('Post not found');
    }
  }

  /**
   * Single page
   * GET /:slug
   */
  @Get(':slug')
  async page(@Param('slug') slug: string, @Res() res: Response) {
    try {
      const page = await this.pagesService.findBySlug(slug);
      
      if (page.status !== PostStatus.PUBLISHED) {
        res.status(404).send('Page not found');
        return;
      }

      const html = await this.themeRenderer.renderPage(page);
      res.send(html);
    } catch (error) {
      res.status(404).send('Page not found');
    }
  }
}

