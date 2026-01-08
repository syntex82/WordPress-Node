/**
 * Demo Data Seeder Script
 * Seeds a demo database with sample content
 * 
 * Usage: npx ts-node scripts/demo/seed-demo.ts <admin_email> <admin_password_hash>
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.argv[2] || 'demo@nodepress.io';
  const adminPasswordHash = process.argv[3] || await bcrypt.hash('demo123', 10);

  console.log('Seeding demo database...');

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: adminPasswordHash,
      name: 'Demo Admin',
      role: 'ADMIN',
      isActive: true,
      emailVerified: new Date(),
    },
  });
  console.log('Created admin user:', admin.email);

  // Create sample users
  const password = await bcrypt.hash('demo123', 10);
  const users = await Promise.all([
    prisma.user.create({ data: { email: 'editor@demo.com', password, name: 'Sarah Editor', role: 'EDITOR', isActive: true, emailVerified: new Date() } }),
    prisma.user.create({ data: { email: 'author@demo.com', password, name: 'John Author', role: 'AUTHOR', isActive: true, emailVerified: new Date() } }),
    prisma.user.create({ data: { email: 'customer@demo.com', password, name: 'Mike Customer', role: 'VIEWER', isActive: true, emailVerified: new Date() } }),
  ]);
  console.log('Created sample users:', users.length);

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Technology', slug: 'technology', description: 'Tech news and tutorials' } }),
    prisma.category.create({ data: { name: 'Business', slug: 'business', description: 'Business insights' } }),
    prisma.category.create({ data: { name: 'Design', slug: 'design', description: 'UI/UX and graphics' } }),
  ]);
  console.log('Created categories:', categories.length);

  // Create posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        title: 'Welcome to NodePress CMS',
        slug: 'welcome-to-nodepress',
        content: '<h2>Welcome!</h2><p>NodePress is a modern, full-featured CMS built with Node.js.</p>',
        excerpt: 'Discover the powerful features of NodePress.',
        status: 'PUBLISHED',
        authorId: admin.id,
        publishedAt: new Date(),
      },
    }),
    prisma.post.create({
      data: {
        title: '10 Tips for Online Business Success',
        slug: '10-tips-online-business',
        content: '<h2>Business Tips</h2><p>Learn essential strategies for your online business.</p>',
        excerpt: 'Essential strategies for launching your online business.',
        status: 'PUBLISHED',
        authorId: admin.id,
        publishedAt: new Date(),
      },
    }),
    prisma.post.create({
      data: {
        title: 'The Future of E-Commerce',
        slug: 'future-of-ecommerce',
        content: '<h2>E-Commerce Trends</h2><p>Explore the trends shaping online retail.</p>',
        excerpt: 'Trends shaping the future of online retail.',
        status: 'PUBLISHED',
        authorId: admin.id,
        publishedAt: new Date(),
      },
    }),
  ]);
  console.log('Created posts:', posts.length);

  // Create pages
  const pages = await Promise.all([
    prisma.page.create({ data: { title: 'About Us', slug: 'about', content: '<h2>About Us</h2><p>We build powerful tools for modern businesses.</p>', authorId: admin.id, status: 'PUBLISHED', publishedAt: new Date() } }),
    prisma.page.create({ data: { title: 'Contact', slug: 'contact', content: '<h2>Contact Us</h2><p>Email: demo@nodepress.io</p>', authorId: admin.id, status: 'PUBLISHED', publishedAt: new Date() } }),
    prisma.page.create({ data: { title: 'Privacy Policy', slug: 'privacy-policy', content: '<h2>Privacy Policy</h2><p>Your privacy is important to us.</p>', authorId: admin.id, status: 'PUBLISHED', publishedAt: new Date() } }),
  ]);
  console.log('Created pages:', pages.length);

  // Create products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Premium Theme',
        slug: 'premium-theme',
        description: 'A beautiful, responsive theme.',
        price: 59.99,
        compareAtPrice: 99.99,
        sku: 'THEME-001',
        inventory: 999,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'NodePress Pro License',
        slug: 'nodepress-pro',
        description: 'Unlock all premium features.',
        price: 199.99,
        sku: 'LICENSE-PRO',
        inventory: 999,
        isActive: true,
      },
    }),
  ]);
  console.log('Created products:', products.length);

  // Create courses
  const course = await prisma.course.create({
    data: {
      title: 'NodePress Masterclass',
      slug: 'nodepress-masterclass',
      description: 'Learn to build powerful websites with NodePress.',
      price: 149.99,
      level: 'BEGINNER',
      duration: 600,
      isPublished: true,
      instructorId: admin.id,
    },
  });

  const module = await prisma.courseModule.create({
    data: {
      courseId: course.id,
      title: 'Getting Started',
      description: 'Introduction and setup',
      order: 1,
    },
  });

  await Promise.all([
    prisma.lesson.create({ data: { moduleId: module.id, title: 'Welcome', type: 'VIDEO', duration: 300, order: 1, content: 'Welcome to the course!' } }),
    prisma.lesson.create({ data: { moduleId: module.id, title: 'Setup', type: 'VIDEO', duration: 600, order: 2, content: 'Setting up your environment.' } }),
  ]);
  console.log('Created course with lessons');

  // Create settings
  await Promise.all([
    prisma.setting.upsert({ where: { key: 'site_name' }, update: {}, create: { key: 'site_name', value: 'NodePress Demo', category: 'general' } }),
    prisma.setting.upsert({ where: { key: 'site_description' }, update: {}, create: { key: 'site_description', value: 'Experience the power of NodePress CMS', category: 'general' } }),
    prisma.setting.upsert({ where: { key: 'posts_per_page' }, update: {}, create: { key: 'posts_per_page', value: '10', category: 'reading' } }),
  ]);
  console.log('Created settings');

  console.log('Demo database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

