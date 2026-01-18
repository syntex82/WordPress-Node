/**
 * SEO Plugin v2.0
 * Advanced SEO with redirects, sitemap, schema markup, and content analysis
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// SEO Score Calculator
const calculateSeoScore = (content) => {
  let score = 100;
  const issues = [];
  const suggestions = [];

  // Title checks
  if (!content.metaTitle) {
    issues.push('Missing meta title');
    score -= 15;
  } else {
    if (content.metaTitle.length < 30) {
      issues.push('Meta title too short (< 30 chars)');
      score -= 5;
    }
    if (content.metaTitle.length > 60) {
      issues.push('Meta title too long (> 60 chars)');
      score -= 5;
    }
  }

  // Description checks
  if (!content.metaDescription) {
    issues.push('Missing meta description');
    score -= 15;
  } else {
    if (content.metaDescription.length < 70) {
      issues.push('Meta description too short (< 70 chars)');
      score -= 5;
      suggestions.push('Aim for 120-160 characters in meta description');
    }
    if (content.metaDescription.length > 160) {
      issues.push('Meta description too long (> 160 chars)');
      score -= 5;
    }
  }

  // Content length - safely strip HTML tags (loop handles nested/malformed tags)
  let plainContent = content.content || '';
  let prevLength = 0;
  while (plainContent.length !== prevLength) {
    prevLength = plainContent.length;
    plainContent = plainContent.replace(/<[^>]+>/g, '');
  }
  if (plainContent.length < 300) {
    issues.push('Content too short (< 300 chars)');
    score -= 10;
    suggestions.push('Write at least 300 words for better SEO');
  }

  // Image alt text check (basic)
  const imgRegex = /<img[^>]*>/gi;
  const images = content.content?.match(imgRegex) || [];
  const imagesWithoutAlt = images.filter(img => !img.includes('alt=') || img.includes('alt=""'));
  if (imagesWithoutAlt.length > 0) {
    issues.push(`${imagesWithoutAlt.length} image(s) missing alt text`);
    score -= 5;
  }

  // Heading structure
  const hasH1 = /<h1[^>]*>/i.test(content.content || '');
  if (!hasH1) {
    suggestions.push('Consider adding an H1 heading to your content');
  }

  // Internal links
  const linkRegex = /<a[^>]*href=[^>]*>/gi;
  const links = content.content?.match(linkRegex) || [];
  if (links.length === 0) {
    suggestions.push('Add internal links to improve SEO');
  }

  return { score: Math.max(0, score), issues, suggestions };
};

// Generate robots.txt content
const generateRobotsTxt = (baseUrl) => {
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/

Sitemap: ${baseUrl}/api/seo/sitemap.xml`;
};

module.exports = {
  onActivate: async () => {
    console.log('🔍 SEO Plugin v2.0 activated');
  },

  onDeactivate: async () => {
    console.log('🔍 SEO Plugin deactivated');
  },

  registerFields: () => [
    { name: 'metaTitle', label: 'Meta Title', type: 'text', description: 'SEO title (30-60 chars)', maxLength: 60 },
    { name: 'metaDescription', label: 'Meta Description', type: 'textarea', description: 'SEO description (70-160 chars)', maxLength: 160 },
    { name: 'metaKeywords', label: 'Focus Keywords', type: 'text', description: 'Main keywords (comma-separated)' },
    { name: 'ogImage', label: 'Social Image', type: 'media', description: 'Image for social sharing (1200x630 recommended)' },
    { name: 'ogTitle', label: 'Social Title', type: 'text', description: 'Title for social media (optional)' },
    { name: 'ogDescription', label: 'Social Description', type: 'textarea', description: 'Description for social media (optional)' },
    { name: 'canonicalUrl', label: 'Canonical URL', type: 'text', description: 'Canonical URL (if different from page URL)' },
    { name: 'noIndex', label: 'No Index', type: 'boolean', description: 'Hide from search engines' },
    { name: 'noFollow', label: 'No Follow', type: 'boolean', description: 'Tell search engines not to follow links' },
  ],

  beforeSave: async (data) => {
    // Auto-generate meta title
    if (!data.metaTitle && data.title) {
      data.metaTitle = data.title.substring(0, 60);
    }
    // Auto-generate meta description
    if (!data.metaDescription) {
      const source = data.excerpt || data.content || '';
      // Safely strip HTML tags (loop handles nested/malformed tags)
      let plainText = source;
      let prevLen = 0;
      while (plainText.length !== prevLen) {
        prevLen = plainText.length;
        plainText = plainText.replace(/<[^>]+>/g, '');
      }
      data.metaDescription = plainText.trim().substring(0, 160);
    }
    // Auto-generate social title/description
    if (!data.ogTitle) data.ogTitle = data.metaTitle;
    if (!data.ogDescription) data.ogDescription = data.metaDescription;
    // Calculate and store SEO score
    const analysis = calculateSeoScore(data);
    data.seoScore = analysis.score;
    return data;
  },

  // Exported utilities
  calculateSeoScore,
  generateRobotsTxt,

  // Check for redirect
  checkRedirect: async (path) => {
    try {
      const redirect = await prisma.seoRedirect.findUnique({
        where: { fromPath: path, isActive: true },
      });
      if (redirect) {
        await prisma.seoRedirect.update({
          where: { id: redirect.id },
          data: { hitCount: { increment: 1 }, lastHitAt: new Date() },
        });
      }
      return redirect;
    } catch (e) {
      return null;
    }
  },

  // Generate meta tags for a page
  generateMetaTags: (content, baseUrl = '') => {
    const tags = [];
    if (content.metaTitle) tags.push(`<title>${content.metaTitle}</title>`);
    if (content.metaDescription) tags.push(`<meta name="description" content="${content.metaDescription}">`);
    if (content.metaKeywords) tags.push(`<meta name="keywords" content="${content.metaKeywords}">`);
    if (content.noIndex || content.noFollow) {
      const robots = [content.noIndex ? 'noindex' : 'index', content.noFollow ? 'nofollow' : 'follow'].join(', ');
      tags.push(`<meta name="robots" content="${robots}">`);
    }
    if (content.canonicalUrl) tags.push(`<link rel="canonical" href="${content.canonicalUrl}">`);
    // Open Graph
    if (content.ogTitle) tags.push(`<meta property="og:title" content="${content.ogTitle}">`);
    if (content.ogDescription) tags.push(`<meta property="og:description" content="${content.ogDescription}">`);
    if (content.ogImage) tags.push(`<meta property="og:image" content="${baseUrl}${content.ogImage}">`);
    tags.push(`<meta property="og:type" content="website">`);
    // Twitter Card
    tags.push(`<meta name="twitter:card" content="summary_large_image">`);
    if (content.ogTitle) tags.push(`<meta name="twitter:title" content="${content.ogTitle}">`);
    if (content.ogDescription) tags.push(`<meta name="twitter:description" content="${content.ogDescription}">`);
    if (content.ogImage) tags.push(`<meta name="twitter:image" content="${baseUrl}${content.ogImage}">`);
    return tags.join('\n    ');
  },
};

