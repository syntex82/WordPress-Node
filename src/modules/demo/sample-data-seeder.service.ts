import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as bcrypt from 'bcrypt';

/**
 * Sample Data Seeder Service
 *
 * Seeds isolated demo data tagged with demoInstanceId.
 * All seeded data belongs ONLY to the specific demo instance.
 *
 * SECURITY: demoInstanceId is REQUIRED to ensure data isolation.
 */
@Injectable()
export class SampleDataSeederService {
  private readonly logger = new Logger(SampleDataSeederService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Seed all sample data for a demo instance
   *
   * @param demoInstanceId - REQUIRED - ID of the demo instance (for data isolation)
   * @param adminEmail - Email for the demo admin user
   * @param adminPasswordHash - Pre-hashed password for admin
   */
  async seedAll(
    demoInstanceId: string,
    adminEmail: string,
    adminPasswordHash: string,
  ): Promise<{ adminUserId: string }> {
    if (!demoInstanceId) {
      throw new Error('demoInstanceId is required for seeding demo data');
    }

    this.logger.log(`Seeding sample data for demo: ${demoInstanceId}`);

    // Create admin user for this demo
    const admin = await this.seedAdminUser(demoInstanceId, adminEmail, adminPasswordHash);

    // Seed in parallel for speed
    await Promise.all([
      this.seedUsers(demoInstanceId),
      this.seedCategories(), // Categories are shared (not demo-specific)
      this.seedSettings(),   // Settings are shared
    ]);

    await Promise.all([
      this.seedPosts(demoInstanceId, admin.id),
      this.seedPages(demoInstanceId, admin.id),
      this.seedProducts(demoInstanceId),
      this.seedCourses(demoInstanceId, admin.id),
      this.seedMedia(demoInstanceId, admin.id),
    ]);

    this.logger.log(`Sample data seeded successfully for demo: ${demoInstanceId}`);
    return { adminUserId: admin.id };
  }

  /**
   * Clean up all data for a demo instance
   */
  async cleanupDemoData(demoInstanceId: string): Promise<void> {
    this.logger.log(`Cleaning up demo data for: ${demoInstanceId}`);

    // Delete in order to respect foreign keys
    await this.prisma.media.deleteMany({ where: { demoInstanceId } });
    await this.prisma.course.deleteMany({ where: { demoInstanceId } });
    await this.prisma.product.deleteMany({ where: { demoInstanceId } });
    await this.prisma.page.deleteMany({ where: { demoInstanceId } });
    await this.prisma.post.deleteMany({ where: { demoInstanceId } });
    await this.prisma.user.deleteMany({ where: { demoInstanceId } });

    this.logger.log(`Demo data cleaned up for: ${demoInstanceId}`);
  }

  private async seedAdminUser(demoInstanceId: string, email: string, passwordHash: string) {
    return this.prisma.user.create({
      data: {
        email,
        password: passwordHash,
        name: 'Demo Admin',
        role: 'ADMIN',
        demoInstanceId, // Tag with demo ID
      },
    });
  }

  private async seedUsers(demoInstanceId: string) {
    const password = await bcrypt.hash('demo123', 10);
    // Use unique emails per demo to avoid conflicts
    const shortId = demoInstanceId.slice(-6);

    const users = [
      { email: `editor-${shortId}@demo.local`, name: 'Sarah Editor', role: 'EDITOR' as const },
      { email: `author-${shortId}@demo.local`, name: 'John Author', role: 'AUTHOR' as const },
      { email: `viewer-${shortId}@demo.local`, name: 'Jane Viewer', role: 'VIEWER' as const },
      { email: `customer-${shortId}@demo.local`, name: 'Mike Customer', role: 'VIEWER' as const },
      { email: `student-${shortId}@demo.local`, name: 'Lisa Student', role: 'VIEWER' as const },
    ];

    for (const user of users) {
      await this.prisma.user.create({
        data: { ...user, password, demoInstanceId },
      });
    }
  }

  private async seedCategories() {
    // Note: ProductCategory model exists, not Category
    // Categories will be created via product seeding if needed
  }

  private async seedSettings() {
    // Settings have a different schema - skip for demo
    // Real settings should already exist in the main DB
  }

  private async seedPosts(demoInstanceId: string, authorId: string) {
    const shortId = demoInstanceId.slice(-6);
    const posts = [
      {
        title: 'Welcome to NodePress CMS',
        slug: `welcome-to-nodepress-${shortId}`,
        content: this.getWelcomeContent(),
        excerpt: 'Discover the powerful features of NodePress, your all-in-one platform.',
        status: 'PUBLISHED' as const,
      },
      {
        title: '10 Tips for Building a Successful Online Business',
        slug: `10-tips-online-business-${shortId}`,
        content: this.getBusinessTipsContent(),
        excerpt: 'Learn the essential strategies for launching and growing your online business.',
        status: 'PUBLISHED' as const,
      },
      {
        title: 'The Future of E-Commerce in 2025',
        slug: `future-of-ecommerce-2025-${shortId}`,
        content: this.getEcommerceContent(),
        excerpt: 'Explore the trends shaping the future of online retail.',
        status: 'PUBLISHED' as const,
      },
      {
        title: 'Getting Started with Online Courses',
        slug: `getting-started-online-courses-${shortId}`,
        content: this.getLMSContent(),
        excerpt: 'How to create and sell your first online course.',
        status: 'PUBLISHED' as const,
      },
      {
        title: 'Draft: Upcoming Features',
        slug: `upcoming-features-draft-${shortId}`,
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
          demoInstanceId,
          publishedAt: post.status === 'PUBLISHED' ? new Date() : null,
        },
      });
    }
  }

  private async seedPages(demoInstanceId: string, authorId: string) {
    const shortId = demoInstanceId.slice(-6);
    const pages = [
      { title: 'About Us', slug: `about-${shortId}`, content: this.getAboutContent() },
      { title: 'Contact', slug: `contact-${shortId}`, content: this.getContactContent() },
      { title: 'Privacy Policy', slug: `privacy-policy-${shortId}`, content: this.getPrivacyContent() },
      { title: 'Terms of Service', slug: `terms-of-service-${shortId}`, content: this.getTermsContent() },
    ];

    for (const page of pages) {
      await this.prisma.page.create({
        data: { ...page, authorId, demoInstanceId, status: 'PUBLISHED', publishedAt: new Date() },
      });
    }
  }

  private async seedProducts(demoInstanceId: string) {
    const shortId = demoInstanceId.slice(-6);

    // Create products using direct data to match Prisma schema
    await this.prisma.product.createMany({
      data: [
        {
          name: 'Premium Theme',
          slug: `premium-theme-${shortId}`,
          description: 'A beautiful, responsive theme for modern websites.',
          price: 59.99,
          demoInstanceId,
        },
        {
          name: 'Pro License',
          slug: `pro-license-${shortId}`,
          description: 'Unlock all premium features with a Pro license.',
          price: 199.99,
          demoInstanceId,
        },
        {
          name: 'Development Package',
          slug: `dev-package-${shortId}`,
          description: '10 hours of custom development and consultation.',
          price: 999.99,
          demoInstanceId,
        },
      ],
      skipDuplicates: true,
    });
  }

  private async seedCourses(demoInstanceId: string, instructorId: string) {
    const shortId = demoInstanceId.slice(-6);

    // Create courses with simplified data matching schema
    const courses = [
      {
        title: 'NodePress Masterclass',
        slug: `nodepress-masterclass-${shortId}`,
        description: 'Learn to build powerful websites with NodePress CMS.',
        level: 'BEGINNER' as const,
        estimatedHours: 10,
      },
      {
        title: 'E-Commerce Course',
        slug: `ecommerce-course-${shortId}`,
        description: 'Build a complete online store from scratch.',
        level: 'INTERMEDIATE' as const,
        estimatedHours: 15,
      },
      {
        title: 'Theme Development',
        slug: `theme-dev-${shortId}`,
        description: 'Create custom themes with the visual editor.',
        level: 'ADVANCED' as const,
        estimatedHours: 8,
      },
    ];

    for (const course of courses) {
      const created = await this.prisma.course.create({
        data: { ...course, instructorId, demoInstanceId },
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
        orderIndex: 1,
      },
    });

    const lessons = [
      { title: 'Welcome', type: 'VIDEO' as const, estimatedMinutes: 5 },
      { title: 'Setup', type: 'VIDEO' as const, estimatedMinutes: 10 },
      { title: 'First Project', type: 'VIDEO' as const, estimatedMinutes: 15 },
    ];

    for (let i = 0; i < lessons.length; i++) {
      await this.prisma.lesson.create({
        data: {
          courseId: module.courseId,
          moduleId: module.id,
          title: lessons[i].title,
          type: lessons[i].type,
          estimatedMinutes: lessons[i].estimatedMinutes,
          orderIndex: i + 1,
          content: `Content for ${lessons[i].title}`,
        },
      });
    }
  }

  private async seedMedia(demoInstanceId: string, uploadedById: string) {
    const media = [
      { filename: 'hero-image.jpg', originalName: 'hero-image.jpg', mimeType: 'image/jpeg', size: 245000, path: '/uploads/demo/hero-image.jpg' },
      { filename: 'logo.png', originalName: 'logo.png', mimeType: 'image/png', size: 12000, path: '/uploads/demo/logo.png' },
      { filename: 'product-1.jpg', originalName: 'product-1.jpg', mimeType: 'image/jpeg', size: 180000, path: '/uploads/demo/product-1.jpg' },
    ];

    for (const m of media) {
      await this.prisma.media.create({
        data: { ...m, uploadedById, demoInstanceId },
      });
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

