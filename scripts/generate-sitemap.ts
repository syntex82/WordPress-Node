#!/usr/bin/env ts-node
/**
 * Sitemap Generator Script
 * Generates sitemap.xml from database content
 * Run with: npx ts-node scripts/generate-sitemap.ts
 * Or add to cron: 0 * * * * cd /var/www/WordPress-Node && npx ts-node scripts/generate-sitemap.ts
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();
const BASE_URL = process.env.SITE_URL || 'https://wordpressnode.co.uk';

async function generateSitemap() {
  console.log('🗺️  Generating sitemap...');

  const [posts, pages, products, courses] = await Promise.all([
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.page.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { slug: true, updatedAt: true },
    }),
    prisma.course.findMany({
      where: { status: 'PUBLISHED' },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  interface SitemapUrl {
    loc: string;
    lastmod?: string;
    priority: string;
    changefreq: string;
  }

  const urls: SitemapUrl[] = [
    { loc: BASE_URL, priority: '1.0', changefreq: 'daily' },
    { loc: `${BASE_URL}/blog`, priority: '0.9', changefreq: 'daily' },
    { loc: `${BASE_URL}/shop`, priority: '0.9', changefreq: 'daily' },
    { loc: `${BASE_URL}/courses`, priority: '0.9', changefreq: 'weekly' },
    ...posts.map(p => ({
      loc: `${BASE_URL}/blog/${p.slug}`,
      lastmod: p.updatedAt.toISOString().split('T')[0],
      priority: '0.8',
      changefreq: 'weekly',
    })),
    ...pages.map(p => ({
      loc: `${BASE_URL}/${p.slug}`,
      lastmod: p.updatedAt.toISOString().split('T')[0],
      priority: '0.7',
      changefreq: 'monthly',
    })),
    ...products.map(p => ({
      loc: `${BASE_URL}/shop/product/${p.slug}`,
      lastmod: p.updatedAt.toISOString().split('T')[0],
      priority: '0.8',
      changefreq: 'weekly',
    })),
    ...courses.map(c => ({
      loc: `${BASE_URL}/courses/${c.slug}`,
      lastmod: c.updatedAt.toISOString().split('T')[0],
      priority: '0.8',
      changefreq: 'weekly',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  const sitemapPath = join(process.cwd(), 'public', 'sitemap.xml');
  writeFileSync(sitemapPath, xml);
  
  console.log(`✅ Sitemap generated with ${urls.length} URLs`);
  console.log(`   Posts: ${posts.length}`);
  console.log(`   Pages: ${pages.length}`);
  console.log(`   Products: ${products.length}`);
  console.log(`   Courses: ${courses.length}`);
  console.log(`📍 Saved to: ${sitemapPath}`);
}

generateSitemap()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

