/**
 * SEO Service - Comprehensive SEO management
 */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SeoService {
  constructor(private prisma: PrismaService) {}

  // ============ REDIRECTS ============
  async getRedirects() {
    return this.prisma.seoRedirect.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async createRedirect(data: { fromPath: string; toPath: string; type?: number }) {
    return this.prisma.seoRedirect.create({
      data: { fromPath: data.fromPath, toPath: data.toPath, type: data.type || 301 },
    });
  }

  async updateRedirect(
    id: string,
    data: { fromPath?: string; toPath?: string; type?: number; isActive?: boolean },
  ) {
    return this.prisma.seoRedirect.update({ where: { id }, data });
  }

  async deleteRedirect(id: string) {
    return this.prisma.seoRedirect.delete({ where: { id } });
  }

  async checkRedirect(path: string) {
    const redirect = await this.prisma.seoRedirect.findUnique({
      where: { fromPath: path, isActive: true },
    });
    if (redirect) {
      await this.prisma.seoRedirect.update({
        where: { id: redirect.id },
        data: { hitCount: { increment: 1 }, lastHitAt: new Date() },
      });
    }
    return redirect;
  }

  // ============ SITEMAP ============
  async getSitemapEntries() {
    return this.prisma.seoSitemapEntry.findMany({
      where: { isActive: true },
      orderBy: { priority: 'desc' },
    });
  }

  async createSitemapEntry(data: { url: string; priority?: number; changefreq?: string }) {
    return this.prisma.seoSitemapEntry.create({ data });
  }

  async updateSitemapEntry(
    id: string,
    data: { url?: string; priority?: number; changefreq?: string; isActive?: boolean },
  ) {
    return this.prisma.seoSitemapEntry.update({ where: { id }, data });
  }

  async deleteSitemapEntry(id: string) {
    return this.prisma.seoSitemapEntry.delete({ where: { id } });
  }

  async generateSitemap(baseUrl: string) {
    const [posts, pages, products, courses, customEntries] = await Promise.all([
      this.prisma.post.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.page.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.product.findMany({
        where: { status: 'ACTIVE' },
        select: { slug: true, updatedAt: true },
      }),
      this.prisma.course.findMany({
        where: { status: 'PUBLISHED' },
        select: { slug: true, updatedAt: true },
      }),
      this.getSitemapEntries(),
    ]);

    const urls = [
      { loc: baseUrl, priority: 1.0, changefreq: 'daily' },
      ...posts.map((p) => ({
        loc: `${baseUrl}/blog/${p.slug}`,
        lastmod: p.updatedAt.toISOString(),
        priority: 0.8,
        changefreq: 'weekly',
      })),
      ...pages.map((p) => ({
        loc: `${baseUrl}/${p.slug}`,
        lastmod: p.updatedAt.toISOString(),
        priority: 0.7,
        changefreq: 'monthly',
      })),
      ...products.map((p) => ({
        loc: `${baseUrl}/shop/${p.slug}`,
        lastmod: p.updatedAt.toISOString(),
        priority: 0.8,
        changefreq: 'weekly',
      })),
      ...courses.map((c) => ({
        loc: `${baseUrl}/lms/course/${c.slug}`,
        lastmod: c.updatedAt.toISOString(),
        priority: 0.8,
        changefreq: 'weekly',
      })),
      ...customEntries.map((e) => ({
        loc: e.url.startsWith('http') ? e.url : `${baseUrl}${e.url}`,
        lastmod: e.lastmod.toISOString(),
        priority: e.priority,
        changefreq: e.changefreq,
      })),
    ];

    return this.buildSitemapXml(urls);
  }

  private buildSitemapXml(
    urls: { loc: string; lastmod?: string; priority?: number; changefreq?: string }[],
  ) {
    const urlEntries = urls
      .map(
        (u) => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    ${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}
    ${u.priority ? `<priority>${u.priority}</priority>` : ''}
  </url>`,
      )
      .join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
  }

  // ============ SCHEMA MARKUP ============
  async getSchemaMarkups(scope?: string) {
    const where = scope ? { scope, isActive: true } : { isActive: true };
    return this.prisma.seoSchemaMarkup.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async createSchemaMarkup(data: {
    name: string;
    type: string;
    content: any;
    scope?: string;
    scopeId?: string;
  }) {
    return this.prisma.seoSchemaMarkup.create({ data });
  }

  async updateSchemaMarkup(
    id: string,
    data: {
      name?: string;
      type?: string;
      content?: any;
      scope?: string;
      scopeId?: string;
      isActive?: boolean;
    },
  ) {
    return this.prisma.seoSchemaMarkup.update({ where: { id }, data });
  }

  async deleteSchemaMarkup(id: string) {
    return this.prisma.seoSchemaMarkup.delete({ where: { id } });
  }

  // ============ SEO ANALYSIS ============
  async analyzeContent(contentType: string, contentId: string) {
    let content: any;
    switch (contentType) {
      case 'post':
        content = await this.prisma.post.findUnique({ where: { id: contentId } });
        break;
      case 'page':
        content = await this.prisma.page.findUnique({ where: { id: contentId } });
        break;
      case 'product':
        content = await this.prisma.product.findUnique({ where: { id: contentId } });
        break;
      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }
    if (!content) throw new Error('Content not found');
    return this.performSeoAnalysis(content, contentType);
  }

  private performSeoAnalysis(content: any, contentType: string) {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Title checks
    if (!content.metaTitle) {
      issues.push('Missing meta title');
      score -= 15;
    } else if (content.metaTitle.length < 30) {
      issues.push('Meta title too short (<30 chars)');
      score -= 5;
    } else if (content.metaTitle.length > 60) {
      issues.push('Meta title too long (>60 chars)');
      score -= 5;
    }

    // Description checks
    if (!content.metaDescription) {
      issues.push('Missing meta description');
      score -= 15;
    } else if (content.metaDescription.length < 70) {
      issues.push('Meta description too short (<70 chars)');
      score -= 5;
    } else if (content.metaDescription.length > 160) {
      issues.push('Meta description too long (>160 chars)');
      score -= 5;
    }

    // Content checks
    const plainContent = (content.content || content.description || '').replace(/<[^>]*>/g, '');
    if (plainContent.length < 300) {
      issues.push('Content too short (<300 chars)');
      score -= 10;
      suggestions.push('Add more detailed content for better SEO');
    }

    // Slug check
    if (content.slug && content.slug.includes('_')) {
      issues.push('Slug contains underscores instead of hyphens');
      score -= 5;
    }

    return { score: Math.max(0, score), issues, suggestions, analyzed: new Date().toISOString() };
  }
}
