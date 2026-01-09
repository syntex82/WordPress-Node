/**
 * Email Template Preview Script
 * Generates HTML preview files for all email templates
 * Run with: npx ts-node scripts/preview-email-templates.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';

// Import templates
import { getWelcomeTemplate } from '../src/modules/email/templates/welcome-template';
import { getPasswordResetTemplate } from '../src/modules/email/templates/password-reset-template';
import { getCourseEnrollmentTemplate } from '../src/modules/email/templates/course-enrollment-template';
import { getNewsletterTemplate } from '../src/modules/email/templates/newsletter-template';
import { getOrderConfirmationTemplate } from '../src/modules/email/templates/order-confirmation-template';

// Sample data for templates
const sampleData = {
  site: {
    name: 'NodePress',
    logo: '', // Set to a URL to test logo display
    address: 'London, UK',
    url: 'https://nodepress.co.uk',
  },
  year: new Date().getFullYear(),
  unsubscribeUrl: 'https://nodepress.co.uk/unsubscribe?token=abc123',
  supportEmail: 'support@nodepress.co.uk',
  supportUrl: 'https://nodepress.co.uk/support',
  docsUrl: 'https://nodepress.co.uk/docs',
  coursesUrl: 'https://nodepress.co.uk/courses',
};

const welcomeData = {
  ...sampleData,
  user: { name: 'John Doe', email: 'john@example.com' },
  loginUrl: 'https://nodepress.co.uk/login',
};

const passwordResetData = {
  ...sampleData,
  user: { firstName: 'Jane' },
  resetUrl: 'https://nodepress.co.uk/reset-password?token=xyz789',
  expiresIn: '1 hour',
  supportUrl: 'https://nodepress.co.uk/support',
  supportEmail: 'support@nodepress.co.uk',
};

const courseEnrollmentData = {
  ...sampleData,
  user: { name: 'Alex Johnson' },
  course: {
    title: 'Complete Web Development Bootcamp',
    instructor: 'Sarah Williams',
    thumbnail: 'https://via.placeholder.com/600x300/1e293b/10b981?text=Course+Thumbnail',
    duration: '40 hours',
    lessons: 120,
  },
  courseUrl: 'https://nodepress.co.uk/courses/web-development',
};

const newsletterData = {
  ...sampleData,
  title: 'NodePress Weekly Update',
  previewText: 'Latest news and updates from NodePress',
  content: `
    <h2 style="color: #f1f5f9; margin: 0 0 16px;">🚀 New Features Released!</h2>
    <p style="color: #94a3b8; margin: 0 0 16px;">We're excited to announce several new features including dark mode email templates, improved SEO tools, and enhanced e-commerce capabilities.</p>
    <h3 style="color: #f1f5f9; margin: 24px 0 12px;">📚 Featured Tutorial</h3>
    <p style="color: #94a3b8; margin: 0;">Learn how to build a complete LMS with NodePress in our latest tutorial series.</p>
  `,
  featuredItems: [
    { title: 'Dark Mode Emails', description: 'Beautiful dark-themed email templates', url: '#', image: 'https://via.placeholder.com/300x150/1e293b/10b981?text=Dark+Mode' },
    { title: 'SEO Improvements', description: 'Better search engine optimization', url: '#', image: 'https://via.placeholder.com/300x150/1e293b/10b981?text=SEO' },
  ],
};

const orderConfirmationData = {
  ...sampleData,
  order: {
    number: 'NP-2026-001234',
    date: 'January 5, 2026',
    items: [
      { name: 'Pro Membership - Annual', quantity: 1, price: '£99.00', image: '' },
      { name: 'Premium Theme Pack', quantity: 1, price: '£29.00', image: '' },
    ],
    subtotal: '£128.00',
    shipping: '£0.00',
    tax: '£25.60',
    total: '£153.60',
    shippingAddress: {
      name: 'John Doe',
      street: '123 Tech Lane',
      city: 'London',
      state: 'England',
      zip: 'EC1A 1BB',
      country: 'United Kingdom',
    },
    billingAddress: {
      name: 'John Doe',
      street: '123 Tech Lane',
      city: 'London',
      state: 'England',
      zip: 'EC1A 1BB',
      country: 'United Kingdom',
    },
  },
  orderUrl: 'https://nodepress.co.uk/orders/NP-2026-001234',
};

// Generate previews
const outputDir = path.join(__dirname, '../email-previews');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const templates = [
  { name: 'welcome', template: getWelcomeTemplate(), data: welcomeData },
  { name: 'password-reset', template: getPasswordResetTemplate(passwordResetData as any), data: passwordResetData },
  { name: 'course-enrollment', template: getCourseEnrollmentTemplate(), data: courseEnrollmentData },
  { name: 'newsletter', template: getNewsletterTemplate(), data: newsletterData },
  { name: 'order-confirmation', template: getOrderConfirmationTemplate(), data: orderConfirmationData },
];

console.log('🎨 Generating email template previews...\n');

templates.forEach(({ name, template, data }) => {
  try {
    const compiled = Handlebars.compile(template);
    const html = compiled(data);
    const filePath = path.join(outputDir, `${name}.html`);
    fs.writeFileSync(filePath, html);
    console.log(`✅ ${name}.html - Generated successfully`);
  } catch (error) {
    console.error(`❌ ${name}.html - Error: ${error}`);
  }
});

console.log(`\n📁 Preview files saved to: ${outputDir}`);
console.log('💡 Open any HTML file in a browser to preview the email template');

