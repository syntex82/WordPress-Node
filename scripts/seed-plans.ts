/**
 * Subscription Plans Seed Script
 * 
 * This script creates or updates subscription plans in the database.
 * 
 * Usage:
 *   npx ts-node scripts/seed-plans.ts
 * 
 * Before running:
 *   1. Create products in Stripe Dashboard (https://dashboard.stripe.com/products)
 *   2. Copy the Price IDs (price_xxx) for each plan's monthly and yearly prices
 *   3. Replace the placeholder Price IDs below with your actual Stripe Price IDs
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPlans() {
  console.log('🚀 Seeding subscription plans...\n');

  const plans = [
    {
      name: 'Free',
      slug: 'free',
      description: 'Perfect for getting started',
      monthlyPrice: 0,
      yearlyPrice: 0,
      maxUsers: 1,
      maxStorageMb: 100,
      maxProducts: 5,
      maxCourses: 1,
      maxProjects: 1,
      features: ['basic_cms', 'media_library'],
      isActive: true,
      isFeatured: false,
      displayOrder: 0,
      trialDays: 0,
    },
    {
      name: 'Pro',
      slug: 'pro',
      description: 'For professionals and small teams',
      monthlyPrice: 19,
      yearlyPrice: 190,
      // ⚠️ Replace with your actual Stripe Price IDs
      stripePriceIdMonthly: 'price_REPLACE_WITH_YOUR_PRO_MONTHLY_ID',
      stripePriceIdYearly: 'price_REPLACE_WITH_YOUR_PRO_YEARLY_ID',
      maxUsers: 5,
      maxStorageMb: 10240, // 10 GB
      maxProducts: 100,
      maxCourses: 10,
      maxProjects: 10,
      features: [
        'basic_cms',
        'media_library',
        'video_calls',
        'lms',
        'ecommerce',
        'analytics',
      ],
      isActive: true,
      isFeatured: true,
      badgeText: 'Most Popular',
      displayOrder: 1,
      trialDays: 14,
    },
    {
      name: 'Business',
      slug: 'business',
      description: 'For growing businesses',
      monthlyPrice: 49,
      yearlyPrice: 490,
      // ⚠️ Replace with your actual Stripe Price IDs
      stripePriceIdMonthly: 'price_REPLACE_WITH_YOUR_BUSINESS_MONTHLY_ID',
      stripePriceIdYearly: 'price_REPLACE_WITH_YOUR_BUSINESS_YEARLY_ID',
      maxUsers: 25,
      maxStorageMb: 102400, // 100 GB
      maxProducts: null, // Unlimited
      maxCourses: null, // Unlimited
      maxProjects: null, // Unlimited
      features: [
        'basic_cms',
        'media_library',
        'video_calls',
        'lms',
        'ecommerce',
        'analytics',
        'api_access',
        'priority_support',
        'custom_domain',
      ],
      isActive: true,
      isFeatured: false,
      displayOrder: 2,
      trialDays: 14,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Custom solutions for large organizations',
      monthlyPrice: 199,
      yearlyPrice: 1990,
      // ⚠️ Replace with your actual Stripe Price IDs
      stripePriceIdMonthly: 'price_REPLACE_WITH_YOUR_ENTERPRISE_MONTHLY_ID',
      stripePriceIdYearly: 'price_REPLACE_WITH_YOUR_ENTERPRISE_YEARLY_ID',
      maxUsers: null, // Unlimited
      maxStorageMb: null, // Unlimited
      maxProducts: null, // Unlimited
      maxCourses: null, // Unlimited
      maxProjects: null, // Unlimited
      features: [
        'basic_cms',
        'media_library',
        'video_calls',
        'lms',
        'ecommerce',
        'analytics',
        'api_access',
        'priority_support',
        'custom_domain',
        'sla',
        'dedicated_support',
        'custom_integrations',
      ],
      isActive: true,
      isFeatured: false,
      badgeText: 'Best Value',
      displayOrder: 3,
      trialDays: 30,
    },
  ];

  for (const plan of plans) {
    const result = await prisma.subscriptionPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
    console.log(`✅ ${plan.name} plan: ${result.id}`);
  }

  console.log('\n🎉 All subscription plans seeded successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Create products in Stripe Dashboard');
  console.log('   2. Copy the Price IDs for each plan');
  console.log('   3. Update this script with real Price IDs');
  console.log('   4. Run this script again to update the plans');
  
  await prisma.$disconnect();
}

seedPlans().catch((error) => {
  console.error('❌ Error seeding plans:', error);
  prisma.$disconnect();
  process.exit(1);
});

