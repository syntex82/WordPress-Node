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

