import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export interface CustomizationExport {
  version: string;
  exportedAt: string;
  pages: any[];
  posts: any[];
}

@Injectable()
export class CustomizationExportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Export all page customizations
   */
  async exportPageCustomizations(): Promise<CustomizationExport> {
    const pages = await this.prisma.pageCustomization.findMany({
      include: {
        page: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      pages: pages.map((p) => ({
        ...p,
        pageTitle: p.page?.title,
        pageSlug: p.page?.slug,
      })),
      posts: [],
    };
  }

  /**
   * Export all post customizations
   */
  async exportPostCustomizations(): Promise<CustomizationExport> {
    const posts = await this.prisma.postCustomization.findMany({
      include: {
        post: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    });

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      pages: [],
      posts: posts.map((p) => ({
        ...p,
        postTitle: p.post?.title,
        postSlug: p.post?.slug,
      })),
    };
  }

  /**
   * Export all customizations (pages and posts)
   */
  async exportAllCustomizations(): Promise<CustomizationExport> {
    const [pages, posts] = await Promise.all([
      this.prisma.pageCustomization.findMany({
        include: {
          page: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
      this.prisma.postCustomization.findMany({
        include: {
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      }),
    ]);

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      pages: pages.map((p) => ({
        ...p,
        pageTitle: p.page?.title,
        pageSlug: p.page?.slug,
      })),
      posts: posts.map((p) => ({
        ...p,
        postTitle: p.post?.title,
        postSlug: p.post?.slug,
      })),
    };
  }

  /**
   * Import customizations from export file
   */
  async importCustomizations(
    data: CustomizationExport,
  ): Promise<{ imported: number; failed: number }> {
    if (!data.version || !data.exportedAt) {
      throw new BadRequestException('Invalid export file format');
    }

    let imported = 0;
    let failed = 0;

    // Import page customizations
    for (const pageCustom of data.pages || []) {
      try {
        await this.prisma.pageCustomization.upsert({
          where: { pageId: pageCustom.pageId },
          update: {
            layout: pageCustom.layout,
            showHeader: pageCustom.showHeader,
            showFooter: pageCustom.showFooter,
            showSidebar: pageCustom.showSidebar,
            customCSS: pageCustom.customCSS,
            backgroundColor: pageCustom.backgroundColor,
            textColor: pageCustom.textColor,
            headerStyle: pageCustom.headerStyle,
            footerStyle: pageCustom.footerStyle,
            featuredImagePosition: pageCustom.featuredImagePosition,
            customFields: pageCustom.customFields,
          },
          create: {
            pageId: pageCustom.pageId,
            layout: pageCustom.layout,
            showHeader: pageCustom.showHeader,
            showFooter: pageCustom.showFooter,
            showSidebar: pageCustom.showSidebar,
            customCSS: pageCustom.customCSS,
            backgroundColor: pageCustom.backgroundColor,
            textColor: pageCustom.textColor,
            headerStyle: pageCustom.headerStyle,
            footerStyle: pageCustom.footerStyle,
            featuredImagePosition: pageCustom.featuredImagePosition,
            customFields: pageCustom.customFields,
          },
        });
        imported++;
      } catch (error) {
        console.error(`Failed to import page customization: ${error.message}`);
        failed++;
      }
    }

    // Import post customizations
    for (const postCustom of data.posts || []) {
      try {
        await this.prisma.postCustomization.upsert({
          where: { postId: postCustom.postId },
          update: {
            layout: postCustom.layout,
            showHeader: postCustom.showHeader,
            showFooter: postCustom.showFooter,
            showSidebar: postCustom.showSidebar,
            showAuthor: postCustom.showAuthor,
            showDate: postCustom.showDate,
            showCategory: postCustom.showCategory,
            showTags: postCustom.showTags,
            showRelatedPosts: postCustom.showRelatedPosts,
            relatedPostsCount: postCustom.relatedPostsCount,
            customCSS: postCustom.customCSS,
            backgroundColor: postCustom.backgroundColor,
            textColor: postCustom.textColor,
            featuredImagePosition: postCustom.featuredImagePosition,
            customFields: postCustom.customFields,
          },
          create: {
            postId: postCustom.postId,
            layout: postCustom.layout,
            showHeader: postCustom.showHeader,
            showFooter: postCustom.showFooter,
            showSidebar: postCustom.showSidebar,
            showAuthor: postCustom.showAuthor,
            showDate: postCustom.showDate,
            showCategory: postCustom.showCategory,
            showTags: postCustom.showTags,
            showRelatedPosts: postCustom.showRelatedPosts,
            relatedPostsCount: postCustom.relatedPostsCount,
            customCSS: postCustom.customCSS,
            backgroundColor: postCustom.backgroundColor,
            textColor: postCustom.textColor,
            featuredImagePosition: postCustom.featuredImagePosition,
            customFields: postCustom.customFields,
          },
        });
        imported++;
      } catch (error) {
        console.error(`Failed to import post customization: ${error.message}`);
        failed++;
      }
    }

    return { imported, failed };
  }
}
