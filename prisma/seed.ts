/**
 * Database Seed Script
 * Creates initial data: admin user, sample content, settings, theme, and plugins
 */

import { PrismaClient, UserRole, PostStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@example.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: UserRole.ADMIN,
      bio: 'System administrator',
    },
  });
  console.log('✅ Admin user created:', admin.email);

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
    where: { slug: 'welcome-to-wordpress-node' },
    update: {},
    create: {
      title: 'Welcome to WordPress Node',
      slug: 'welcome-to-wordpress-node',
      content: `
        <h2>Welcome to WordPress Node CMS!</h2>
        <p>This is a modern, self-hosted CMS platform built with Node.js, TypeScript, and NestJS. 
        It brings the familiar WordPress experience to the Node.js ecosystem with a powerful plugin 
        and theme system.</p>
        
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
      excerpt: 'Welcome to WordPress Node CMS - a modern, self-hosted CMS platform built with Node.js.',
      status: PostStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: admin.id,
      metaTitle: 'Welcome to WordPress Node CMS',
      metaDescription: 'Discover the features of WordPress Node, a modern CMS built with Node.js and TypeScript.',
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
        <h2>Getting Started with WordPress Node</h2>
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
      excerpt: 'Learn how to get started with WordPress Node CMS in just a few simple steps.',
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
        <h1>About WordPress Node</h1>
        <p>WordPress Node is a modern content management system built for developers who love Node.js 
        and want the flexibility of WordPress-style content management.</p>
        
        <h2>Our Mission</h2>
        <p>To provide a powerful, extensible, and developer-friendly CMS platform that combines the 
        best of WordPress with modern JavaScript technologies.</p>
        
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
      value: process.env.SITE_NAME || 'WordPress Node',
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
      author: 'WordPress Node',
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

  // Create plugins
  const seoPlugin = await prisma.plugin.upsert({
    where: { slug: 'seo' },
    update: {},
    create: {
      name: 'SEO Plugin',
      slug: 'seo',
      version: '1.0.0',
      author: 'WordPress Node',
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
      author: 'WordPress Node',
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

