import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SampleDataSeederService {
  private readonly logger = new Logger(SampleDataSeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Seed all sample data for a demo instance
   */
  async seedAll(adminEmail: string, adminPasswordHash: string): Promise<void> {
    this.logger.log('Seeding sample data...');

    // Create admin user
    const admin = await this.seedAdminUser(adminEmail, adminPasswordHash);

    // Seed in parallel for speed
    await Promise.all([
      this.seedUsers(),
      this.seedCategories(),
      this.seedSettings(),
    ]);

    await Promise.all([
      this.seedPosts(admin.id),
      this.seedPages(admin.id),
      this.seedProducts(),
      this.seedCourses(admin.id),
      this.seedMedia(admin.id),
    ]);

    this.logger.log('Sample data seeded successfully');
  }

  private async seedAdminUser(email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: 'Demo Admin',
        role: 'ADMIN',
        isActive: true,
        emailVerified: new Date(),
      },
    });
  }

  private async seedUsers() {
    const password = await bcrypt.hash('demo123', 10);
    
    const users = [
      { email: 'editor@demo.com', name: 'Sarah Editor', role: 'EDITOR' as const },
      { email: 'author@demo.com', name: 'John Author', role: 'AUTHOR' as const },
      { email: 'viewer@demo.com', name: 'Jane Viewer', role: 'VIEWER' as const },
      { email: 'customer@demo.com', name: 'Mike Customer', role: 'VIEWER' as const },
      { email: 'student@demo.com', name: 'Lisa Student', role: 'VIEWER' as const },
    ];

    for (const user of users) {
      await this.prisma.user.create({
        data: { ...user, password, isActive: true, emailVerified: new Date() },
      });
    }
  }

  private async seedCategories() {
    const categories = [
      { name: 'Technology', slug: 'technology', description: 'Tech news and tutorials' },
      { name: 'Business', slug: 'business', description: 'Business insights and strategies' },
      { name: 'Design', slug: 'design', description: 'UI/UX and graphic design' },
      { name: 'Marketing', slug: 'marketing', description: 'Digital marketing tips' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Life and productivity' },
    ];

    for (const cat of categories) {
      await this.prisma.category.create({ data: cat });
    }
  }

  private async seedSettings() {
    const settings = [
      { key: 'site_name', value: 'NodePress Demo', category: 'general' },
      { key: 'site_description', value: 'Experience the power of NodePress CMS', category: 'general' },
      { key: 'site_tagline', value: 'Modern CMS for Modern Businesses', category: 'general' },
      { key: 'posts_per_page', value: '10', category: 'reading' },
      { key: 'allow_comments', value: 'true', category: 'discussion' },
      { key: 'timezone', value: 'UTC', category: 'general' },
    ];

    for (const setting of settings) {
      await this.prisma.setting.upsert({
        where: { key: setting.key },
        update: { value: setting.value },
        create: setting,
      });
    }
  }

  private async seedPosts(authorId: string) {
    const posts = [
      {
        title: 'Welcome to NodePress CMS',
        slug: 'welcome-to-nodepress',
        content: this.getWelcomeContent(),
        excerpt: 'Discover the powerful features of NodePress, your all-in-one platform.',
        status: 'PUBLISHED' as const,
      },
      {
        title: '10 Tips for Building a Successful Online Business',
        slug: '10-tips-online-business',
        content: this.getBusinessTipsContent(),
        excerpt: 'Learn the essential strategies for launching and growing your online business.',
        status: 'PUBLISHED' as const,
      },
      {
        title: 'The Future of E-Commerce in 2025',
        slug: 'future-of-ecommerce-2025',
        content: this.getEcommerceContent(),
        excerpt: 'Explore the trends shaping the future of online retail.',
        status: 'PUBLISHED' as const,
      },
      {
        title: 'Getting Started with Online Courses',
        slug: 'getting-started-online-courses',
        content: this.getLMSContent(),
        excerpt: 'How to create and sell your first online course.',
        status: 'PUBLISHED' as const,
      },
      {
        title: 'Draft: Upcoming Features',
        slug: 'upcoming-features-draft',
        content: 'This is a draft post showing upcoming features...',
        excerpt: 'Preview of upcoming NodePress features.',
        status: 'DRAFT' as const,
      },
    ];

    for (const post of posts) {
      await this.prisma.post.create({
        data: {
          ...post,
          authorId,
          publishedAt: post.status === 'PUBLISHED' ? new Date() : null,
        },
      });
    }
  }

  private async seedPages(authorId: string) {
    const pages = [
      { title: 'About Us', slug: 'about', content: this.getAboutContent() },
      { title: 'Contact', slug: 'contact', content: this.getContactContent() },
      { title: 'Privacy Policy', slug: 'privacy-policy', content: this.getPrivacyContent() },
      { title: 'Terms of Service', slug: 'terms-of-service', content: this.getTermsContent() },
    ];

    for (const page of pages) {
      await this.prisma.page.create({
        data: { ...page, authorId, status: 'PUBLISHED', publishedAt: new Date() },
      });
    }
  }

  private async seedProducts() {
    const products = [
      {
        name: 'Premium WordPress Theme',
        slug: 'premium-wordpress-theme',
        description: 'A beautiful, responsive theme for modern websites.',
        price: 59.99,
        compareAtPrice: 99.99,
        sku: 'THEME-001',
        inventory: 999,
        isActive: true,
        images: ['https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=600'],
      },
      {
        name: 'NodePress Pro License',
        slug: 'nodepress-pro-license',
        description: 'Unlock all premium features with a Pro license.',
        price: 199.99,
        sku: 'LICENSE-PRO',
        inventory: 999,
        isActive: true,
        images: ['https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600'],
      },
      {
        name: 'Custom Development Package',
        slug: 'custom-development',
        description: '10 hours of custom development and consultation.',
        price: 999.99,
        sku: 'DEV-10HR',
        inventory: 10,
        isActive: true,
        images: ['https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600'],
      },
    ];

    for (const product of products) {
      await this.prisma.product.create({ data: product });
    }
  }

  private async seedCourses(instructorId: string) {
    const courses = [
      {
        title: 'NodePress Masterclass',
        slug: 'nodepress-masterclass',
        description: 'Learn to build powerful websites with NodePress CMS.',
        price: 149.99,
        level: 'BEGINNER' as const,
        duration: 600,
        isPublished: true,
      },
      {
        title: 'E-Commerce with NodePress',
        slug: 'ecommerce-nodepress',
        description: 'Build a complete online store from scratch.',
        price: 199.99,
        level: 'INTERMEDIATE' as const,
        duration: 900,
        isPublished: true,
      },
      {
        title: 'Theme Development Deep Dive',
        slug: 'theme-development',
        description: 'Create custom themes with the visual editor.',
        price: 99.99,
        level: 'ADVANCED' as const,
        duration: 480,
        isPublished: true,
      },
    ];

    for (const course of courses) {
      const created = await this.prisma.course.create({
        data: { ...course, instructorId },
      });

      // Add sample modules and lessons
      await this.seedCourseLessons(created.id);
    }
  }

  private async seedCourseLessons(courseId: string) {
    const module = await this.prisma.courseModule.create({
      data: {
        courseId,
        title: 'Getting Started',
        description: 'Introduction and setup',
        order: 1,
      },
    });

    const lessons = [
      { title: 'Welcome to the Course', type: 'VIDEO' as const, duration: 300 },
      { title: 'Setting Up Your Environment', type: 'VIDEO' as const, duration: 600 },
      { title: 'Your First Project', type: 'VIDEO' as const, duration: 900 },
      { title: 'Knowledge Check', type: 'QUIZ' as const, duration: 300 },
    ];

    for (let i = 0; i < lessons.length; i++) {
      await this.prisma.lesson.create({
        data: {
          ...lessons[i],
          moduleId: module.id,
          order: i + 1,
          content: `Content for ${lessons[i].title}`,
        },
      });
    }
  }

  private async seedMedia(uploaderId: string) {
    const media = [
      { filename: 'hero-image.jpg', originalName: 'hero-image.jpg', mimeType: 'image/jpeg', size: 245000, url: '/uploads/demo/hero-image.jpg' },
      { filename: 'logo.png', originalName: 'logo.png', mimeType: 'image/png', size: 12000, url: '/uploads/demo/logo.png' },
      { filename: 'product-1.jpg', originalName: 'product-1.jpg', mimeType: 'image/jpeg', size: 180000, url: '/uploads/demo/product-1.jpg' },
    ];

    for (const m of media) {
      await this.prisma.media.create({ data: { ...m, uploaderId } });
    }
  }

  // ==================== CONTENT TEMPLATES ====================

  private getWelcomeContent(): string {
    return `
<h2>Welcome to NodePress CMS</h2>
<p>NodePress is a modern, full-featured content management system built with Node.js, NestJS, React, and PostgreSQL.</p>

<h3>What You Can Do</h3>
<ul>
  <li><strong>Content Management</strong> - Create pages, posts, and custom content types</li>
  <li><strong>E-Commerce</strong> - Sell products with a complete shopping cart and checkout</li>
  <li><strong>Online Courses</strong> - Build and sell courses with our LMS module</li>
  <li><strong>Theme Designer</strong> - Customize your site with our visual editor</li>
  <li><strong>AI Theme Generator</strong> - Create themes from text descriptions</li>
</ul>

<p>Explore the admin panel to see all features in action!</p>
    `.trim();
  }

  private getBusinessTipsContent(): string {
    return `
<h2>10 Tips for Building a Successful Online Business</h2>
<p>Starting an online business has never been easier, but success requires strategy and dedication.</p>

<h3>1. Define Your Niche</h3>
<p>Focus on a specific market segment where you can provide unique value.</p>

<h3>2. Build a Strong Brand</h3>
<p>Create a memorable brand identity that resonates with your target audience.</p>

<h3>3. Invest in Quality Content</h3>
<p>Content marketing drives organic traffic and builds trust with potential customers.</p>
    `.trim();
  }

  private getEcommerceContent(): string {
    return '<h2>The Future of E-Commerce</h2><p>Explore the latest trends in online retail...</p>';
  }

  private getLMSContent(): string {
    return '<h2>Getting Started with Online Courses</h2><p>Learn how to create engaging educational content...</p>';
  }

  private getAboutContent(): string {
    return '<h2>About Us</h2><p>We are passionate about creating powerful tools for modern businesses...</p>';
  }

  private getContactContent(): string {
    return '<h2>Contact Us</h2><p>Get in touch with our team. Email: demo@nodepress.io</p>';
  }

  private getPrivacyContent(): string {
    return '<h2>Privacy Policy</h2><p>Your privacy is important to us...</p>';
  }

  private getTermsContent(): string {
    return '<h2>Terms of Service</h2><p>By using our services, you agree to these terms...</p>';
  }
}

