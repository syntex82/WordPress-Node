/**
 * SEO Service - Comprehensive SEO management
 */
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SeoService implements OnModuleInit {
  private readonly logger = new Logger(SeoService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Initialize default SEO settings on startup
    await this.initializeDefaultSeoSettings();
  }

  // Initialize default SEO settings if they don't exist
  private async initializeDefaultSeoSettings() {
    const seoSettings = [
      { key: 'seo_site_title', value: 'NodePress', type: 'string', group: 'seo' },
      { key: 'seo_site_description', value: 'NodePress - A modern, powerful CMS built with Node.js. Create beautiful websites, blogs, and e-commerce stores.', type: 'string', group: 'seo' },
      { key: 'seo_site_keywords', value: 'nodepress, cms, content management, nodejs, blog, ecommerce, lms', type: 'string', group: 'seo' },
      { key: 'seo_og_image', value: '/images/og-nodepress.jpg', type: 'string', group: 'seo' },
      { key: 'seo_twitter_handle', value: '@nodepress', type: 'string', group: 'seo' },
      { key: 'seo_google_site_verification', value: '', type: 'string', group: 'seo' },
      { key: 'seo_bing_site_verification', value: '', type: 'string', group: 'seo' },
      { key: 'seo_robots_txt_custom', value: '', type: 'string', group: 'seo' },
      { key: 'seo_organization_name', value: 'NodePress', type: 'string', group: 'seo' },
      { key: 'seo_organization_logo', value: '', type: 'string', group: 'seo' },
      { key: 'seo_organization_address', value: '', type: 'string', group: 'seo' },
      { key: 'seo_organization_phone', value: '', type: 'string', group: 'seo' },
      { key: 'seo_organization_email', value: 'support@nodepress.co.uk', type: 'string', group: 'seo' },
      { key: 'seo_social_facebook', value: '', type: 'string', group: 'seo' },
      { key: 'seo_social_twitter', value: '@nodepress', type: 'string', group: 'seo' },
      { key: 'seo_social_instagram', value: '', type: 'string', group: 'seo' },
      { key: 'seo_social_linkedin', value: '', type: 'string', group: 'seo' },
      { key: 'seo_social_youtube', value: '', type: 'string', group: 'seo' },
    ];

    for (const setting of seoSettings) {
      try {
        // Check if setting exists first
        const existing = await this.prisma.setting.findUnique({
          where: { key: setting.key },
        });
        if (!existing) {
          await this.prisma.setting.create({
            data: setting,
          });
        }
      } catch (error) {
        this.logger.warn(`Could not initialize setting ${setting.key}: ${error.message}`);
      }
    }
    this.logger.log('SEO settings initialized');
  }

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

  private performSeoAnalysis(content: any, _contentType: string) {
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

  // ============ SEO SETTINGS ============
  async getSeoSettings() {
    const settings = await this.prisma.setting.findMany({
      where: { group: 'seo' },
    });
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key.replace('seo_', '')] = s.value as string;
    }
    return result;
  }

  async updateSeoSettings(data: Record<string, string>) {
    for (const [key, value] of Object.entries(data)) {
      const settingKey = `seo_${key}`;
      const existing = await this.prisma.setting.findUnique({
        where: { key: settingKey },
      });
      if (existing) {
        await this.prisma.setting.update({
          where: { key: settingKey },
          data: { value },
        });
      } else {
        await this.prisma.setting.create({
          data: { key: settingKey, value, type: 'string', group: 'seo' },
        });
      }
    }
    return this.getSeoSettings();
  }

  // ============ ROBOTS.TXT ============
  async generateRobotsTxt(baseUrl: string) {
    const customRobots = await this.prisma.setting.findUnique({
      where: { key: 'seo_robots_txt_custom' },
    });

    if (customRobots?.value && (customRobots.value as string).trim()) {
      return customRobots.value as string;
    }

    return `# Robots.txt generated by NodePress CMS
User-agent: *
Allow: /

# Disallow admin and API paths
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /login
Disallow: /register
Disallow: /forgot-password
Disallow: /reset-password

# Allow specific API endpoints for crawlers
Allow: /api/seo/sitemap.xml

# Crawl-delay for polite crawling
Crawl-delay: 1

# Sitemap location
Sitemap: ${baseUrl}/api/seo/sitemap.xml
`;
  }

  // ============ ORGANIZATION SCHEMA ============
  async generateOrganizationSchema(baseUrl: string) {
    const settings = await this.getSeoSettings();

    const schema: any = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: settings.organization_name || settings.site_title || 'Organization',
      url: baseUrl,
    };

    if (settings.site_description) {
      schema.description = settings.site_description;
    }
    if (settings.organization_logo) {
      schema.logo = settings.organization_logo.startsWith('http')
        ? settings.organization_logo
        : `${baseUrl}${settings.organization_logo}`;
    }
    if (settings.organization_email) {
      schema.email = settings.organization_email;
    }
    if (settings.organization_phone) {
      schema.telephone = settings.organization_phone;
    }
    if (settings.organization_address) {
      schema.address = {
        '@type': 'PostalAddress',
        streetAddress: settings.organization_address,
      };
    }

    // Social profiles
    const sameAs: string[] = [];
    if (settings.social_facebook) sameAs.push(settings.social_facebook);
    if (settings.social_twitter) sameAs.push(settings.social_twitter);
    if (settings.social_instagram) sameAs.push(settings.social_instagram);
    if (settings.social_linkedin) sameAs.push(settings.social_linkedin);
    if (settings.social_youtube) sameAs.push(settings.social_youtube);

    if (sameAs.length > 0) {
      schema.sameAs = sameAs;
    }

    return schema;
  }

  // ============ WEBSITE SCHEMA ============
  async generateWebsiteSchema(baseUrl: string) {
    const settings = await this.getSeoSettings();

    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: settings.site_title || 'Website',
      description: settings.site_description || '',
      url: baseUrl,
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/search?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    };
  }

  // ============ BREADCRUMB SCHEMA ============
  generateBreadcrumbSchema(baseUrl: string, items: { name: string; url: string }[]) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
      })),
    };
  }

  // ============ ARTICLE SCHEMA ============
  async generateArticleSchema(baseUrl: string, article: {
    title: string;
    description: string;
    slug: string;
    publishedAt: Date;
    updatedAt: Date;
    authorName: string;
    image?: string;
  }) {
    const settings = await this.getSeoSettings();

    return {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.description,
      url: `${baseUrl}/blog/${article.slug}`,
      datePublished: article.publishedAt.toISOString(),
      dateModified: article.updatedAt.toISOString(),
      author: {
        '@type': 'Person',
        name: article.authorName,
      },
      publisher: {
        '@type': 'Organization',
        name: settings.organization_name || settings.site_title || 'Publisher',
        logo: settings.organization_logo ? {
          '@type': 'ImageObject',
          url: settings.organization_logo.startsWith('http')
            ? settings.organization_logo
            : `${baseUrl}${settings.organization_logo}`,
        } : undefined,
      },
      image: article.image ? (article.image.startsWith('http') ? article.image : `${baseUrl}${article.image}`) : undefined,
    };
  }

  // ============ PRODUCT SCHEMA ============
  generateProductSchema(baseUrl: string, product: {
    name: string;
    description: string;
    slug: string;
    price: number;
    currency?: string;
    image?: string;
    sku?: string;
    inStock?: boolean;
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      url: `${baseUrl}/shop/${product.slug}`,
      sku: product.sku || product.slug,
      image: product.image ? (product.image.startsWith('http') ? product.image : `${baseUrl}${product.image}`) : undefined,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'USD',
        availability: product.inStock !== false
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url: `${baseUrl}/shop/${product.slug}`,
      },
    };
  }

  // ============ COURSE SCHEMA ============
  generateCourseSchema(baseUrl: string, course: {
    name: string;
    description: string;
    slug: string;
    instructorName: string;
    price?: number;
    currency?: string;
    image?: string;
  }) {
    return {
      '@context': 'https://schema.org',
      '@type': 'Course',
      name: course.name,
      description: course.description,
      url: `${baseUrl}/courses/${course.slug}`,
      provider: {
        '@type': 'Organization',
        name: course.instructorName,
      },
      image: course.image ? (course.image.startsWith('http') ? course.image : `${baseUrl}${course.image}`) : undefined,
      offers: course.price ? {
        '@type': 'Offer',
        price: course.price,
        priceCurrency: course.currency || 'USD',
      } : undefined,
    };
  }

  // ============ GLOBAL META TAGS ============
  async getGlobalMetaTags(baseUrl: string) {
    const settings = await this.getSeoSettings();

    return {
      title: settings.site_title || 'Website',
      description: settings.site_description || '',
      keywords: settings.site_keywords || '',
      ogImage: settings.og_image ? (settings.og_image.startsWith('http') ? settings.og_image : `${baseUrl}${settings.og_image}`) : '',
      twitterHandle: settings.twitter_handle || '',
      googleVerification: settings.google_site_verification || '',
      bingVerification: settings.bing_site_verification || '',
    };
  }
}
