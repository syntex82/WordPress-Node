/**
 * Database Seed Script
 * Creates initial data: admin user, sample content, settings, theme, and plugins
 *
 * PRODUCTION MODE:
 * - Checks if setup is complete first
 * - Skips admin creation if one already exists (use setup wizard instead)
 * - Only seeds essential data like themes and plugins
 *
 * DEVELOPMENT MODE:
 * - Requires ADMIN_PASSWORD in .env for local development
 * - Creates admin user with specified credentials
 */

import { PrismaClient, UserRole, PostStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Password strength validation
 * Requirements:
 * - Minimum 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password) {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?`~)');
  }

  return { valid: errors.length === 0, errors };
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Check if this is a production deployment (setup already completed)
  let setupComplete = false;
  try {
    const status = await prisma.setupStatus.findFirst();
    setupComplete = status?.setupComplete ?? false;
  } catch {
    // Table may not exist yet, that's fine
  }

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });

  // In production or if setup is complete, skip admin seeding
  if (setupComplete) {
    console.log('ℹ️  Setup already complete - skipping admin creation');
    console.log('   Use the admin panel to manage users');
  } else if (existingAdmin && !process.env.ADMIN_PASSWORD) {
    // Admin exists but no password provided - skip password update
    console.log('ℹ️  Admin user already exists - skipping admin creation');
    console.log('   To reset password, use the "Forgot Password" feature or set ADMIN_PASSWORD in .env');
  } else {
    // Development mode or first-time setup with ADMIN_PASSWORD
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      console.log('\n⚠️  No ADMIN_PASSWORD set in .env');
      console.log('');
      console.log('For DEVELOPMENT: Set ADMIN_PASSWORD in your .env file:');
      console.log('  ADMIN_PASSWORD=YourSecurePassword123!');
      console.log('');
      console.log('For PRODUCTION: Skip this and use the Setup Wizard at /setup');
      console.log('');

      if (!existingAdmin) {
        console.log('❌ Cannot proceed: No admin exists and no ADMIN_PASSWORD provided');
        console.log('   Either set ADMIN_PASSWORD or complete setup via the Setup Wizard');
        process.exit(1);
      }
    } else {
      const passwordValidation = validatePasswordStrength(adminPassword);

      if (!passwordValidation.valid) {
        console.error('\n❌ SECURITY ERROR: ADMIN_PASSWORD does not meet security requirements!');
        console.error('');
        console.error('Issues found:');
        passwordValidation.errors.forEach(error => {
          console.error(`  • ${error}`);
        });
        console.error('');
        console.error('Please update ADMIN_PASSWORD in your .env file to meet all requirements.');
        console.error('');
        process.exit(1);
      }

      console.log('✅ Admin password validated - meets security requirements');

      // Create or update admin user
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      const admin = await prisma.user.upsert({
        where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' },
        update: {
          password: hashedAdminPassword,
          role: UserRole.ADMIN,
        },
        create: {
          email: process.env.ADMIN_EMAIL || 'admin@example.com',
          name: 'Admin User',
          password: hashedAdminPassword,
          role: UserRole.ADMIN,
          bio: 'System administrator',
        },
      });
      console.log('✅ Admin user created/updated:', admin.email);
    }
  }

  // Get or create admin reference for sample content
  const admin = await prisma.user.findFirst({ where: { role: UserRole.ADMIN } });
  if (!admin) {
    console.log('⚠️  No admin user found - skipping sample content creation');
    console.log('   Complete setup via the Setup Wizard to create an admin');
    return;
  }
  console.log('✅ Using admin user:', admin.email);

  // Create sample author
  const authorPassword = await bcrypt.hash('author123', 10);
  const author = await prisma.user.upsert({
    where: { email: 'author@example.com' },
    update: {},
    create: {
      email: 'author@example.com',
      name: 'John Doe',
      password: authorPassword,
      role: UserRole.AUTHOR,
      bio: 'Content writer and blogger',
    },
  });
  console.log('✅ Author user created:', author.email);

  // Create sample posts
  const post1 = await prisma.post.upsert({
    where: { slug: 'welcome-to-NodePress' },
    update: {},
    create: {
      title: 'Welcome to NodePress',
      slug: 'welcome-to-NodePress',
      content: `
        <h2>Welcome to NodePress CMS!</h2>
        <p>This is a modern, self-hosted CMS platform built with Node.js, TypeScript, and NestJS.
        It provides a powerful plugin and theme system for the Node.js ecosystem.</p>
        
        <h3>Key Features</h3>
        <ul>
          <li>Built with TypeScript and NestJS for type safety and scalability</li>
          <li>PostgreSQL database with Prisma ORM</li>
          <li>Extensible plugin system with lifecycle hooks</li>
          <li>Theme system with Handlebars templates</li>
          <li>Role-based access control</li>
          <li>RESTful API for headless CMS usage</li>
        </ul>
        
        <p>Get started by exploring the admin panel and creating your first post!</p>
      `,
      excerpt: 'Welcome to NodePress CMS - a modern, self-hosted CMS platform built with Node.js.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: admin.id,
      metaTitle: 'Welcome to NodePress CMS',
      metaDescription: 'Discover the features of NodePress, a modern CMS built with Node.js and TypeScript.',
    },
  });
  console.log('✅ Sample post created:', post1.title);

  const post2 = await prisma.post.upsert({
    where: { slug: 'getting-started-guide' },
    update: {},
    create: {
      title: 'Getting Started Guide',
      slug: 'getting-started-guide',
      content: `
        <h2>Getting Started with NodePress</h2>
        <p>This guide will help you get up and running with your new CMS.</p>
        
        <h3>1. Access the Admin Panel</h3>
        <p>Navigate to <code>/admin</code> and log in with your credentials.</p>
        
        <h3>2. Create Your First Post</h3>
        <p>Go to Posts → Add New and start writing!</p>
        
        <h3>3. Customize Your Theme</h3>
        <p>Visit Themes to activate and customize your site's appearance.</p>
        
        <h3>4. Install Plugins</h3>
        <p>Extend functionality with plugins like SEO and Analytics.</p>
      `,
      excerpt: 'Learn how to get started with NodePress CMS in just a few simple steps.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: author.id,
    },
  });
  console.log('✅ Sample post created:', post2.title);

  // Create sample page
  const page1 = await prisma.page.upsert({
    where: { slug: 'about' },
    update: {},
    create: {
      title: 'About Us',
      slug: 'about',
      content: `
        <h1>About NodePress</h1>
        <p>NodePress is a modern content management system built for developers who love Node.js 
        and want the flexibility of modern content management.</p>
        
        <h2>Our Mission</h2>
        <p>To provide a powerful, extensible, and developer-friendly CMS platform built with
        modern JavaScript technologies.</p>
        
        <h2>Technology Stack</h2>
        <ul>
          <li>Node.js & TypeScript</li>
          <li>NestJS Framework</li>
          <li>PostgreSQL & Prisma</li>
          <li>React Admin Panel</li>
          <li>Handlebars Templating</li>
        </ul>
      `,
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: admin.id,
    },
  });
  console.log('✅ Sample page created:', page1.title);

  // Create settings
  await prisma.setting.upsert({
    where: { key: 'site_name' },
    update: {},
    create: {
      key: 'site_name',
      value: process.env.SITE_NAME || 'NodePress',
      type: 'string',
      group: 'general',
    },
  });

  await prisma.setting.upsert({
    where: { key: 'site_description' },
    update: {},
    create: {
      key: 'site_description',
      value: process.env.SITE_DESCRIPTION || 'A modern CMS built with Node.js',
      type: 'string',
      group: 'general',
    },
  });
  console.log('✅ Settings created');

  // Create default theme
  const defaultTheme = await prisma.theme.upsert({
    where: { slug: 'default' },
    update: {},
    create: {
      name: 'Default Theme',
      slug: 'default',
      version: '1.0.0',
      author: 'NodePress',
      description: 'A clean, modern default theme',
      path: '/themes/default',
      config: {
        name: 'Default Theme',
        version: '1.0.0',
        templates: ['home', 'single-post', 'single-page', 'archive'],
      },
      isActive: true,
    },
  });
  console.log('✅ Default theme created:', defaultTheme.name);

  // Create default CustomTheme (for Theme Customizer/Style Customizer)
  const defaultCustomTheme = await prisma.customTheme.upsert({
    where: { name: 'Default Style' },
    update: {},
    create: {
      name: 'Default Style',
      description: 'Default styling for your website',
      settings: {
        colors: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          background: '#FFFFFF',
          surface: '#F9FAFB',
          text: '#1F2937',
          textMuted: '#6B7280',
          heading: '#111827',
          link: '#3B82F6',
          linkHover: '#2563EB',
          border: '#E5E7EB',
          accent: '#F59E0B',
        },
        typography: {
          headingFont: 'Inter',
          bodyFont: 'Inter',
          baseFontSize: 16,
          lineHeight: 1.6,
          headingWeight: 700,
        },
        layout: {
          sidebarPosition: 'right',
          contentWidth: 1200,
          headerStyle: 'default',
          footerStyle: 'default',
        },
        spacing: {
          sectionPadding: 48,
          elementSpacing: 24,
          containerPadding: 24,
        },
        borders: {
          radius: 8,
          width: 1,
        },
      },
      isActive: true,
      isDefault: true,
      createdById: admin.id,
    },
  });
  console.log('✅ Default CustomTheme created:', defaultCustomTheme.name);

  // Create plugins
  const seoPlugin = await prisma.plugin.upsert({
    where: { slug: 'seo' },
    update: {},
    create: {
      name: 'SEO Plugin',
      slug: 'seo',
      version: '1.0.0',
      author: 'NodePress',
      description: 'Adds SEO meta fields to posts and pages',
      path: '/plugins/seo',
      config: {
        name: 'SEO Plugin',
        hooks: ['beforeSave', 'registerFields'],
      },
      isActive: true,
    },
  });
  console.log('✅ SEO plugin created:', seoPlugin.name);

  const analyticsPlugin = await prisma.plugin.upsert({
    where: { slug: 'analytics' },
    update: {},
    create: {
      name: 'Analytics Plugin',
      slug: 'analytics',
      version: '1.0.0',
      author: 'NodePress',
      description: 'Tracks page views and provides analytics',
      path: '/plugins/analytics',
      config: {
        name: 'Analytics Plugin',
        hooks: ['onActivate', 'registerRoutes'],
      },
      isActive: true,
    },
  });
  console.log('✅ Analytics plugin created:', analyticsPlugin.name);

  // Create sample LMS course
  const course = await prisma.course.upsert({
    where: { slug: 'introduction-to-web-development' },
    update: {},
    create: {
      title: 'Introduction to Web Development',
      slug: 'introduction-to-web-development',
      description: `
        <p>Learn the fundamentals of web development from scratch. This comprehensive course covers HTML, CSS, and JavaScript basics.</p>
        <p>By the end of this course, you'll be able to build your own responsive websites and understand core web technologies.</p>
      `,
      shortDescription: 'Master the basics of HTML, CSS, and JavaScript to build modern websites.',
      category: 'Web Development',
      level: 'BEGINNER',
      priceType: 'FREE',
      status: 'PUBLISHED',
      instructorId: admin.id,
      estimatedHours: 10,
      certificateEnabled: true,
      whatYouLearn: [
        'Build responsive websites with HTML and CSS',
        'Understand JavaScript fundamentals',
        'Work with the DOM and events',
        'Create interactive web pages',
      ],
      requirements: [
        'A computer with internet access',
        'No prior programming experience required',
      ],
    },
  });
  console.log('✅ Sample course created:', course.title);

  // Create a sample video asset first
  const videoAsset = await prisma.videoAsset.upsert({
    where: { id: 'video-1-intro' },
    update: {},
    create: {
      id: 'video-1-intro',
      provider: 'YOUTUBE',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Sample video
      playbackId: 'dQw4w9WgXcQ',
      durationSeconds: 212,
    },
  });

  // Create lessons for the course
  const lesson1 = await prisma.lesson.upsert({
    where: { id: 'lesson-1-intro' },
    update: {},
    create: {
      id: 'lesson-1-intro',
      title: 'Welcome to Web Development',
      content: '<p>Welcome to this course! In this lesson, we will introduce you to the world of web development.</p>',
      type: 'VIDEO',
      orderIndex: 1,
      estimatedMinutes: 10,
      isPreview: true,
      isRequired: true,
      courseId: course.id,
      videoAssetId: videoAsset.id,
    },
  });

  const lesson2 = await prisma.lesson.upsert({
    where: { id: 'lesson-2-html' },
    update: {},
    create: {
      id: 'lesson-2-html',
      title: 'HTML Basics',
      content: '<p>Learn the structure of HTML documents and common HTML elements.</p>',
      type: 'ARTICLE',
      orderIndex: 2,
      estimatedMinutes: 30,
      isRequired: true,
      courseId: course.id,
    },
  });

  const lesson3 = await prisma.lesson.upsert({
    where: { id: 'lesson-3-css' },
    update: {},
    create: {
      id: 'lesson-3-css',
      title: 'CSS Fundamentals',
      content: '<p>Style your web pages with CSS selectors, properties, and layouts.</p>',
      type: 'ARTICLE',
      orderIndex: 3,
      estimatedMinutes: 45,
      isRequired: true,
      courseId: course.id,
    },
  });
  console.log('✅ Sample lessons created with video asset');

  // Create a quiz for the course
  const quiz = await prisma.quiz.upsert({
    where: { id: 'quiz-1-html-basics' },
    update: {},
    create: {
      id: 'quiz-1-html-basics',
      title: 'HTML Basics Quiz',
      description: 'Test your knowledge of HTML fundamentals',
      passingScorePercent: 70,
      attemptsAllowed: 3,
      timeLimitSeconds: 900, // 15 minutes
      isRequired: true,
      orderIndex: 1,
      courseId: course.id,
    },
  });

  // Create quiz questions
  await prisma.question.upsert({
    where: { id: 'q1-html-tag' },
    update: {},
    create: {
      id: 'q1-html-tag',
      type: 'MCQ',
      prompt: 'What does HTML stand for?',
      optionsJson: [
        'Hyper Text Markup Language',
        'High Tech Modern Language',
        'Hyper Transfer Markup Language',
        'Home Tool Markup Language',
      ],
      correctAnswerJson: 'Hyper Text Markup Language',
      points: 10,
      orderIndex: 1,
      quizId: quiz.id,
    },
  });

  await prisma.question.upsert({
    where: { id: 'q2-html-element' },
    update: {},
    create: {
      id: 'q2-html-element',
      type: 'MCQ',
      prompt: 'Which HTML element is used for the largest heading?',
      optionsJson: ['<h6>', '<heading>', '<h1>', '<head>'],
      correctAnswerJson: '<h1>',
      points: 10,
      orderIndex: 2,
      quizId: quiz.id,
    },
  });

  await prisma.question.upsert({
    where: { id: 'q3-html-link' },
    update: {},
    create: {
      id: 'q3-html-link',
      type: 'TRUE_FALSE',
      prompt: 'The <a> tag is used to create hyperlinks in HTML.',
      optionsJson: ['True', 'False'],
      correctAnswerJson: 'True',
      points: 10,
      orderIndex: 3,
      quizId: quiz.id,
    },
  });
  console.log('✅ Sample quiz and questions created');

  // Create sample product category
  const productCategory = await prisma.productCategory.upsert({
    where: { slug: 'electronics' },
    update: {},
    create: {
      name: 'Electronics',
      slug: 'electronics',
      description: 'Electronic devices and accessories',
      image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
    },
  });
  console.log('✅ Sample product category created:', productCategory.name);

  // Create sample products
  const product1 = await prisma.product.upsert({
    where: { slug: 'wireless-headphones' },
    update: {},
    create: {
      name: 'Wireless Headphones Pro',
      slug: 'wireless-headphones',
      description: 'Premium wireless headphones with active noise cancellation, 30-hour battery life, and crystal-clear audio quality. Perfect for music lovers and professionals.',
      shortDescription: 'Premium wireless headphones with ANC',
      price: 199.99,
      salePrice: 149.99,
      sku: 'WHP-001',
      stock: 50,
      images: [
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800',
      ],
      status: 'ACTIVE',
      type: 'PHYSICAL',
      categoryId: productCategory.id,
    },
  });
  console.log('✅ Sample product created:', product1.name);

  const product2 = await prisma.product.upsert({
    where: { slug: 'smart-watch' },
    update: {},
    create: {
      name: 'Smart Watch Ultra',
      slug: 'smart-watch',
      description: 'Advanced smartwatch with health monitoring, GPS, and 7-day battery life. Track your fitness goals and stay connected on the go.',
      shortDescription: 'Advanced smartwatch with health monitoring',
      price: 349.99,
      sku: 'SWU-002',
      stock: 30,
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
        'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800',
      ],
      status: 'ACTIVE',
      type: 'PHYSICAL',
      categoryId: productCategory.id,
    },
  });
  console.log('✅ Sample product created:', product2.name);

  const product3 = await prisma.product.upsert({
    where: { slug: 'portable-speaker' },
    update: {},
    create: {
      name: 'Portable Bluetooth Speaker',
      slug: 'portable-speaker',
      description: 'Compact and powerful Bluetooth speaker with 360° sound, waterproof design, and 20-hour playtime. Take your music anywhere.',
      shortDescription: 'Compact Bluetooth speaker with 360° sound',
      price: 79.99,
      salePrice: 59.99,
      sku: 'PBS-003',
      stock: 100,
      images: [
        'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800',
      ],
      status: 'ACTIVE',
      type: 'PHYSICAL',
      categoryId: productCategory.id,
    },
  });
  console.log('✅ Sample product created:', product3.name);

  const product4 = await prisma.product.upsert({
    where: { slug: 'laptop-stand' },
    update: {},
    create: {
      name: 'Ergonomic Laptop Stand',
      slug: 'laptop-stand',
      description: 'Adjustable aluminum laptop stand for better posture and improved airflow. Compatible with all laptops up to 17 inches.',
      shortDescription: 'Adjustable aluminum laptop stand',
      price: 49.99,
      sku: 'ELS-004',
      stock: 75,
      images: [
        'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800',
      ],
      status: 'ACTIVE',
      type: 'PHYSICAL',
      categoryId: productCategory.id,
    },
  });
  console.log('✅ Sample product created:', product4.name);

  // Create a second category with products
  const clothingCategory = await prisma.productCategory.upsert({
    where: { slug: 'clothing' },
    update: {},
    create: {
      name: 'Clothing',
      slug: 'clothing',
      description: 'Fashion and apparel',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    },
  });

  const product5 = await prisma.product.upsert({
    where: { slug: 'premium-t-shirt' },
    update: {},
    create: {
      name: 'Premium Cotton T-Shirt',
      slug: 'premium-t-shirt',
      description: 'Soft, breathable 100% organic cotton t-shirt. Available in multiple colors and sizes.',
      shortDescription: '100% organic cotton t-shirt',
      price: 29.99,
      sku: 'PCT-005',
      stock: 200,
      images: [
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
      ],
      status: 'ACTIVE',
      type: 'PHYSICAL',
      categoryId: clothingCategory.id,
    },
  });
  console.log('✅ Sample product created:', product5.name);

  // Create product variants for t-shirt
  await prisma.productVariant.upsert({
    where: { sku: 'PCT-005-S-BLK' },
    update: {},
    create: {
      name: 'Small / Black',
      sku: 'PCT-005-S-BLK',
      price: 29.99,
      stock: 50,
      productId: product5.id,
      options: { size: 'Small', color: 'Black' },
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: 'PCT-005-M-BLK' },
    update: {},
    create: {
      name: 'Medium / Black',
      sku: 'PCT-005-M-BLK',
      price: 29.99,
      stock: 50,
      productId: product5.id,
      options: { size: 'Medium', color: 'Black' },
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: 'PCT-005-L-BLK' },
    update: {},
    create: {
      name: 'Large / Black',
      sku: 'PCT-005-L-BLK',
      price: 29.99,
      stock: 50,
      productId: product5.id,
      options: { size: 'Large', color: 'Black' },
    },
  });

  await prisma.productVariant.upsert({
    where: { sku: 'PCT-005-M-WHT' },
    update: {},
    create: {
      name: 'Medium / White',
      sku: 'PCT-005-M-WHT',
      price: 29.99,
      stock: 50,
      productId: product5.id,
      options: { size: 'Medium', color: 'White' },
    },
  });
  console.log('✅ Sample product variants created for t-shirt');

  // =============================================
  // Seed Recommendation Settings
  // =============================================
  console.log('📊 Seeding recommendation settings...');

  const recommendationSettings = [
    { key: 'enablePersonalization', value: true, description: 'Enable personalized recommendations based on user history' },
    { key: 'enableTrending', value: true, description: 'Enable trending content recommendations' },
    { key: 'enableRelated', value: true, description: 'Enable related content recommendations' },
    { key: 'cacheEnabled', value: true, description: 'Enable caching for recommendations' },
    { key: 'cacheDuration', value: 60, description: 'Cache duration in minutes' },
    { key: 'maxRecommendations', value: 10, description: 'Maximum recommendations to show' },
    { key: 'minScore', value: 0.1, description: 'Minimum score for recommendations' },
  ];

  for (const setting of recommendationSettings) {
    await prisma.recommendationSettings.upsert({
      where: { key: setting.key },
      update: { value: setting.value, description: setting.description },
      create: { key: setting.key, value: setting.value, description: setting.description },
    });
  }
  console.log('✅ Recommendation settings seeded');

  // Seed a sample recommendation rule
  console.log('📋 Seeding sample recommendation rule...');
  await prisma.recommendationRule.upsert({
    where: { id: 'sample-related-posts-rule' },
    update: {},
    create: {
      id: 'sample-related-posts-rule',
      name: 'Related Posts',
      description: 'Show related posts based on categories and tags',
      sourceType: 'post',
      targetType: 'post',
      algorithm: 'related',
      settings: { matchCategories: true, matchTags: true, limit: 6 },
      priority: 10,
      isActive: true,
    },
  });

  await prisma.recommendationRule.upsert({
    where: { id: 'sample-trending-rule' },
    update: {},
    create: {
      id: 'sample-trending-rule',
      name: 'Trending Content',
      description: 'Show trending posts from the last 7 days',
      sourceType: 'global',
      targetType: 'post',
      algorithm: 'trending',
      settings: { timeframeDays: 7, limit: 5 },
      priority: 5,
      isActive: true,
    },
  });

  await prisma.recommendationRule.upsert({
    where: { id: 'sample-related-products-rule' },
    update: {},
    create: {
      id: 'sample-related-products-rule',
      name: 'Related Products',
      description: 'Show related products based on categories',
      sourceType: 'product',
      targetType: 'product',
      algorithm: 'related',
      settings: { matchCategories: true, limit: 4 },
      priority: 8,
      isActive: true,
    },
  });
  console.log('✅ Sample recommendation rules seeded');

  // =============================================
  // Seed Sample Analytics Data
  // =============================================
  console.log('📊 Seeding sample analytics data...');

  // Sample pages for analytics
  const samplePaths = ['/', '/blog', '/about', '/contact', '/products', '/courses', '/blog/getting-started', '/products/premium-headphones'];
  const devices = ['desktop', 'mobile', 'tablet'];
  const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  const osList = ['Windows', 'macOS', 'iOS', 'Android', 'Linux'];
  const referers = [null, 'https://google.com', 'https://twitter.com', 'https://facebook.com', 'https://linkedin.com'];

  // Generate analytics for the last 30 days
  const now = new Date();
  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dailyViews = Math.floor(Math.random() * 50) + 20; // 20-70 views per day

    for (let i = 0; i < dailyViews; i++) {
      const randomHour = Math.floor(Math.random() * 24);
      const randomMinute = Math.floor(Math.random() * 60);
      const viewDate = new Date(date);
      viewDate.setHours(randomHour, randomMinute, 0, 0);

      await prisma.pageView.create({
        data: {
          path: samplePaths[Math.floor(Math.random() * samplePaths.length)],
          sessionId: `session-${daysAgo}-${Math.floor(i / 5)}`,
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: `Mozilla/5.0 (${osList[Math.floor(Math.random() * osList.length)]})`,
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          os: osList[Math.floor(Math.random() * osList.length)],
          referer: referers[Math.floor(Math.random() * referers.length)],
          duration: Math.floor(Math.random() * 300) + 10,
          createdAt: viewDate,
        },
      });
    }

    // Create some sessions
    const dailySessions = Math.floor(dailyViews / 5);
    for (let s = 0; s < dailySessions; s++) {
      const sessionDate = new Date(date);
      sessionDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

      await prisma.analyticsSession.create({
        data: {
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: `Mozilla/5.0 (${osList[Math.floor(Math.random() * osList.length)]})`,
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          os: osList[Math.floor(Math.random() * osList.length)],
          referer: referers[Math.floor(Math.random() * referers.length)],
          landingPage: samplePaths[Math.floor(Math.random() * samplePaths.length)],
          pageCount: Math.floor(Math.random() * 8) + 1,
          duration: Math.floor(Math.random() * 600) + 30,
          isActive: daysAgo === 0 && Math.random() > 0.8,
          startedAt: sessionDate,
        },
      });
    }
  }
  console.log('✅ Sample page views and sessions seeded');

  // =============================================
  // Seed Sample Recommendation Analytics Data
  // =============================================
  console.log('📊 Seeding sample recommendation analytics data...');

  // Get all posts and products for recommendations
  const allPosts = await prisma.post.findMany({ take: 10, select: { id: true } });
  const allProducts = await prisma.product.findMany({ take: 10, select: { id: true } });
  const allCourses = await prisma.course.findMany({ take: 5, select: { id: true } });
  const interactionTypes = ['view', 'click', 'like', 'share', 'purchase', 'bookmark'];
  const recommendationTypes = ['related', 'trending', 'popular', 'personalized', 'similar'];

  // Generate user interactions and recommendation clicks for last 30 days
  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const dailyInteractions = Math.floor(Math.random() * 30) + 10;

    for (let i = 0; i < dailyInteractions; i++) {
      const interactionDate = new Date(date);
      interactionDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0);

      // Pick random content
      let contentType: string;
      let contentId: string;
      const contentRand = Math.random();
      if (contentRand < 0.5 && allPosts.length > 0) {
        contentType = 'post';
        contentId = allPosts[Math.floor(Math.random() * allPosts.length)].id;
      } else if (contentRand < 0.8 && allProducts.length > 0) {
        contentType = 'product';
        contentId = allProducts[Math.floor(Math.random() * allProducts.length)].id;
      } else if (allCourses.length > 0) {
        contentType = 'course';
        contentId = allCourses[Math.floor(Math.random() * allCourses.length)].id;
      } else {
        contentType = 'post';
        contentId = allPosts[0]?.id || 'unknown';
      }

      // Create user interaction
      await prisma.userInteraction.create({
        data: {
          sessionId: `rec-session-${daysAgo}-${Math.floor(i / 3)}`,
          contentType,
          contentId,
          interactionType: interactionTypes[Math.floor(Math.random() * interactionTypes.length)],
          metadata: { score: Math.random() * 0.5 + 0.5 },
          createdAt: interactionDate,
        },
      });

      // Create recommendation click (30% of interactions)
      if (Math.random() < 0.3) {
        await prisma.recommendationClick.create({
          data: {
            sessionId: `rec-session-${daysAgo}-${Math.floor(i / 3)}`,
            sourceType: contentType,
            sourceId: contentId,
            clickedType: contentType,
            clickedId: contentId,
            recommendationType: recommendationTypes[Math.floor(Math.random() * recommendationTypes.length)],
            position: Math.floor(Math.random() * 10) + 1,
            createdAt: interactionDate,
          },
        });
      }
    }
  }
  console.log('✅ Sample recommendation analytics seeded');

  // ============ SEO SETTINGS ============
  const seoSettings = [
    { key: 'seo_site_title', value: process.env.SITE_NAME || 'My Website', type: 'string', group: 'seo' },
    { key: 'seo_site_description', value: process.env.SITE_DESCRIPTION || 'Welcome to my website - your destination for quality content, products, and courses.', type: 'string', group: 'seo' },
    { key: 'seo_site_keywords', value: 'website, blog, ecommerce, courses, lms, cms, content management', type: 'string', group: 'seo' },
    { key: 'seo_og_image', value: '/images/og-default.jpg', type: 'string', group: 'seo' },
    { key: 'seo_twitter_handle', value: '', type: 'string', group: 'seo' },
    { key: 'seo_google_site_verification', value: '', type: 'string', group: 'seo' },
    { key: 'seo_bing_site_verification', value: '', type: 'string', group: 'seo' },
    { key: 'seo_robots_txt_custom', value: '', type: 'string', group: 'seo' },
    { key: 'seo_organization_name', value: process.env.SITE_NAME || 'My Organization', type: 'string', group: 'seo' },
    { key: 'seo_organization_logo', value: '/images/logo.png', type: 'string', group: 'seo' },
    { key: 'seo_organization_address', value: '', type: 'string', group: 'seo' },
    { key: 'seo_organization_phone', value: '', type: 'string', group: 'seo' },
    { key: 'seo_organization_email', value: '', type: 'string', group: 'seo' },
    { key: 'seo_social_facebook', value: '', type: 'string', group: 'seo' },
    { key: 'seo_social_twitter', value: '', type: 'string', group: 'seo' },
    { key: 'seo_social_instagram', value: '', type: 'string', group: 'seo' },
    { key: 'seo_social_linkedin', value: '', type: 'string', group: 'seo' },
    { key: 'seo_social_youtube', value: '', type: 'string', group: 'seo' },
  ];

  for (const setting of seoSettings) {
    await prisma.setting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log('✅ SEO settings created');

  // Create default Organization schema markup
  await prisma.seoSchemaMarkup.upsert({
    where: { id: 'default-organization' },
    update: {},
    create: {
      id: 'default-organization',
      name: 'Organization Schema',
      type: 'Organization',
      scope: 'global',
      content: {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: process.env.SITE_NAME || 'My Organization',
        url: process.env.SITE_URL || 'http://localhost:3000',
        description: process.env.SITE_DESCRIPTION || 'Welcome to my website',
      },
      isActive: true,
    },
  });

  // Create default WebSite schema markup
  await prisma.seoSchemaMarkup.upsert({
    where: { id: 'default-website' },
    update: {},
    create: {
      id: 'default-website',
      name: 'WebSite Schema',
      type: 'WebSite',
      scope: 'global',
      content: {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: process.env.SITE_NAME || 'NodePress',
        url: process.env.SITE_URL || 'https://nodepress.co.uk',
        description: 'A modern, powerful CMS built with Node.js',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${process.env.SITE_URL || 'https://nodepress.co.uk'}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      isActive: true,
    },
  });
  console.log('✅ Default schema markups created');

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

