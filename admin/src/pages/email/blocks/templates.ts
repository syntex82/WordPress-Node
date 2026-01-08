/**
 * Professional Email Templates
 * Pre-built templates for e-commerce, education, blog, and SaaS
 */

export interface EmailTemplatePreset {
  id: string;
  name: string;
  category: 'ecommerce' | 'education' | 'blog' | 'saas' | 'general';
  description: string;
  thumbnail: string;
  blocks: any[];
  globalStyles: any;
}

// Template categories with metadata
export const TEMPLATE_CATEGORIES = {
  ecommerce: {
    label: 'E-commerce',
    description: 'Product promotions, order updates, and sales',
    icon: '🛒',
    color: '#10B981'
  },
  education: {
    label: 'Education/LMS',
    description: 'Course updates, certificates, and student engagement',
    icon: '🎓',
    color: '#8B5CF6'
  },
  blog: {
    label: 'Blog/Media',
    description: 'Newsletter digests, article notifications',
    icon: '📝',
    color: '#3B82F6'
  },
  saas: {
    label: 'SaaS',
    description: 'Onboarding, feature updates, usage reports',
    icon: '💻',
    color: '#F59E0B'
  },
  general: {
    label: 'General',
    description: 'Versatile templates for any purpose',
    icon: '📧',
    color: '#6B7280'
  }
};

// Pre-built professional templates
export const EMAIL_TEMPLATES: EmailTemplatePreset[] = [
  // E-COMMERCE TEMPLATES
  {
    id: 'ecom-welcome',
    name: 'Welcome Series',
    category: 'ecommerce',
    description: 'Welcome new customers with a discount offer',
    thumbnail: '/templates/ecom-welcome.png',
    globalStyles: {
      backgroundColor: '#f9fafb',
      contentWidth: 600,
      fontFamily: 'Arial, sans-serif',
      primaryColor: '#4F46E5',
      secondaryColor: '#10B981',
      textColor: '#374151',
      linkColor: '#4F46E5',
      borderRadius: 8
    },
    blocks: [
      { type: 'header', content: { logoUrl: '', title: '{{site.name}}' }, styles: { backgroundColor: '#ffffff', padding: 24, textAlign: 'center' } },
      { type: 'hero', content: { title: 'Welcome to {{site.name}}! 🎉', subtitle: "We're thrilled to have you join our community.", buttonText: 'Start Shopping', buttonLink: '#' }, styles: { backgroundColor: '#4F46E5', textColor: '#ffffff', padding: 48, textAlign: 'center' } },
      { type: 'discountCode', content: { headline: 'Your Exclusive Welcome Gift', description: 'Enjoy 20% off your first order', code: 'WELCOME20', discount: '20% OFF', expiryText: 'Valid for 7 days', buttonText: 'Shop Now', buttonLink: '#' }, styles: { backgroundColor: '#10B981', textColor: '#ffffff', padding: 32 } },
      { type: 'productGrid', content: { title: 'Popular Products', products: [{ name: 'Best Seller', price: '$49', link: '#' }, { name: 'New Arrival', price: '$59', link: '#' }] }, styles: { backgroundColor: '#ffffff', padding: 32 } },
      { type: 'footer', content: { companyName: '{{site.name}}', address: '{{site.address}}', unsubscribeText: 'Unsubscribe' }, styles: { backgroundColor: '#1f2937', padding: 32, color: '#9ca3af' } }
    ]
  },
  {
    id: 'ecom-abandoned-cart',
    name: 'Abandoned Cart',
    category: 'ecommerce',
    description: 'Recover abandoned shopping carts',
    thumbnail: '/templates/ecom-cart.png',
    globalStyles: {
      backgroundColor: '#f9fafb',
      contentWidth: 600,
      fontFamily: 'Arial, sans-serif',
      primaryColor: '#EF4444',
      textColor: '#374151',
      linkColor: '#4F46E5',
      borderRadius: 8
    },
    blocks: [
      { type: 'header', content: { logoUrl: '', title: '{{site.name}}' }, styles: { backgroundColor: '#ffffff', padding: 24, textAlign: 'center' } },
      { type: 'text', content: { text: 'Hi {{user.name}},' }, styles: { backgroundColor: '#ffffff', padding: 24, fontSize: 18, textAlign: 'left' } },
      { type: 'cartAbandonment', content: { headline: 'You forgot something!', subheadline: 'Your cart is waiting...', items: [], buttonText: 'Complete Purchase', buttonLink: '#', urgencyText: 'Items may sell out!' }, styles: { backgroundColor: '#ffffff', padding: 32 } },
      { type: 'discountCode', content: { headline: 'Need a little push?', code: 'COMEBACK10', discount: '10% OFF', buttonText: 'Use Code Now' }, styles: { backgroundColor: '#FEF3C7', textColor: '#92400E', padding: 24 } },
      { type: 'footer', content: { companyName: '{{site.name}}' }, styles: { backgroundColor: '#1f2937', padding: 32 } }
    ]
  },
  {
    id: 'ecom-order-confirm',
    name: 'Order Confirmation',
    category: 'ecommerce',
    description: 'Confirm successful orders',
    thumbnail: '/templates/ecom-order.png',
    globalStyles: { backgroundColor: '#f9fafb', contentWidth: 600, fontFamily: 'Arial, sans-serif', primaryColor: '#10B981', textColor: '#374151', borderRadius: 8 },
    blocks: [
      { type: 'header', content: { logoUrl: '', title: '{{site.name}}' }, styles: { backgroundColor: '#ffffff', padding: 24, textAlign: 'center' } },
      { type: 'orderConfirmation', content: { headline: 'Order Confirmed! ✓', orderNumber: '{{order.number}}' }, styles: { backgroundColor: '#ffffff', padding: 32, accentColor: '#10B981' } },
      { type: 'productRecommendations', content: { title: 'You Might Also Like' }, styles: { backgroundColor: '#f9fafb', padding: 32 } },
      { type: 'footer', content: { companyName: '{{site.name}}' }, styles: { backgroundColor: '#1f2937', padding: 32 } }
    ]
  },
  // EDUCATION TEMPLATES
  {
    id: 'edu-course-enrollment',
    name: 'Course Enrollment',
    category: 'education',
    description: 'Welcome new students to a course',
    thumbnail: '/templates/edu-enroll.png',
    globalStyles: { backgroundColor: '#f5f3ff', contentWidth: 600, fontFamily: 'Arial, sans-serif', primaryColor: '#8B5CF6', textColor: '#374151', borderRadius: 12 },
    blocks: [
      { type: 'header', content: { logoUrl: '', title: '{{site.name}}' }, styles: { backgroundColor: '#ffffff', padding: 24, textAlign: 'center' } },
      { type: 'hero', content: { title: "You're Enrolled! 🎉", subtitle: 'Get ready to start learning', buttonText: 'Go to Course', buttonLink: '#' }, styles: { backgroundColor: '#8B5CF6', textColor: '#ffffff', padding: 48, textAlign: 'center' } },
      { type: 'courseCard', content: { courseTitle: '{{course.title}}', instructor: '{{course.instructor}}', duration: '{{course.duration}}', buttonText: 'Start Learning' }, styles: { backgroundColor: '#ffffff', padding: 32 } },
      { type: 'iconList', content: { title: "What You'll Learn", items: [{ icon: '✓', text: 'Core concepts' }, { icon: '✓', text: 'Practical skills' }] }, styles: { backgroundColor: '#ffffff', padding: 32 } },
      { type: 'footer', content: { companyName: '{{site.name}}' }, styles: { backgroundColor: '#1f2937', padding: 32 } }
    ]
  },
  {
    id: 'edu-lesson-reminder',
    name: 'Lesson Reminder',
    category: 'education',
    description: 'Remind students to continue learning',
    thumbnail: '/templates/edu-reminder.png',
    globalStyles: { backgroundColor: '#f5f3ff', contentWidth: 600, fontFamily: 'Arial, sans-serif', primaryColor: '#8B5CF6', textColor: '#374151', borderRadius: 12 },
    blocks: [
      { type: 'header', content: { title: '{{site.name}}' }, styles: { backgroundColor: '#ffffff', padding: 24 } },
      { type: 'lessonProgress', content: { courseTitle: 'Continue Your Journey', percentComplete: 45, currentLesson: 'Lesson 5', buttonText: 'Resume Learning' }, styles: { backgroundColor: '#ffffff', padding: 32 } },
      { type: 'text', content: { text: "You're making great progress! Keep the momentum going." }, styles: { padding: 24, textAlign: 'center' } },
      { type: 'footer', content: { companyName: '{{site.name}}' }, styles: { backgroundColor: '#1f2937', padding: 32 } }
    ]
  },
  {
    id: 'edu-certificate',
    name: 'Course Certificate',
    category: 'education',
    description: 'Celebrate course completion',
    thumbnail: '/templates/edu-cert.png',
    globalStyles: { backgroundColor: '#1f2937', contentWidth: 600, fontFamily: 'Georgia, serif', primaryColor: '#F59E0B', textColor: '#ffffff', borderRadius: 0 },
    blocks: [
      { type: 'certificateAnnouncement', content: { headline: '🎓 Congratulations!', courseName: '{{course.title}}', studentName: '{{user.name}}', buttonText: 'Download Certificate' }, styles: { backgroundColor: '#1f2937', textColor: '#ffffff', padding: 48, accentColor: '#F59E0B' } },
      { type: 'social', content: { title: 'Share Your Achievement' }, styles: { backgroundColor: '#374151', padding: 24 } },
      { type: 'courseRecommendations', content: { title: 'Continue Learning' }, styles: { backgroundColor: '#111827', padding: 32 } }
    ]
  },

  // BLOG TEMPLATES
  {
    id: 'blog-newsletter',
    name: 'Newsletter Digest',
    category: 'blog',
    description: 'Weekly or monthly content roundup',
    thumbnail: '/templates/blog-digest.png',
    globalStyles: { backgroundColor: '#ffffff', contentWidth: 600, fontFamily: 'Georgia, serif', primaryColor: '#3B82F6', textColor: '#374151', borderRadius: 8 },
    blocks: [
      { type: 'header', content: { title: '{{site.name}} Weekly' }, styles: { backgroundColor: '#3B82F6', textColor: '#ffffff', padding: 24 } },
      { type: 'text', content: { text: "This week's highlights from our blog" }, styles: { padding: 24, fontSize: 18, textAlign: 'center' } },
      { type: 'featuredArticle', content: { category: 'Featured', title: 'Main Article Title', excerpt: 'Article excerpt...', buttonText: 'Read More' }, styles: { backgroundColor: '#ffffff', padding: 0 } },
      { type: 'divider', content: {}, styles: { padding: 24 } },
      { type: 'relatedPosts', content: { title: 'More This Week' }, styles: { backgroundColor: '#f9fafb', padding: 32 } },
      { type: 'newsletterSignup', content: { headline: 'Enjoying our content?', buttonText: 'Share with a Friend' }, styles: { backgroundColor: '#3B82F6', textColor: '#ffffff', padding: 32 } },
      { type: 'footer', content: { companyName: '{{site.name}}' }, styles: { backgroundColor: '#1f2937', padding: 32 } }
    ]
  },
  {
    id: 'blog-new-post',
    name: 'New Post Alert',
    category: 'blog',
    description: 'Notify subscribers of new content',
    thumbnail: '/templates/blog-post.png',
    globalStyles: { backgroundColor: '#ffffff', contentWidth: 600, fontFamily: 'Georgia, serif', primaryColor: '#3B82F6', textColor: '#374151', borderRadius: 8 },
    blocks: [
      { type: 'header', content: { title: '{{site.name}}' }, styles: { backgroundColor: '#ffffff', padding: 24 } },
      { type: 'featuredArticle', content: { title: '{{post.title}}', excerpt: '{{post.excerpt}}', author: '{{post.author}}', buttonText: 'Read Full Article' }, styles: { padding: 0 } },
      { type: 'authorBio', content: { name: '{{post.author}}', bio: 'About the author...' }, styles: { backgroundColor: '#f9fafb', padding: 32 } },
      { type: 'footer', content: { companyName: '{{site.name}}' }, styles: { backgroundColor: '#1f2937', padding: 32 } }
    ]
  },

  // SAAS TEMPLATES
  {
    id: 'saas-onboarding',
    name: 'User Onboarding',
    category: 'saas',
    description: 'Guide new users through setup',
    thumbnail: '/templates/saas-onboard.png',
    globalStyles: { backgroundColor: '#f9fafb', contentWidth: 600, fontFamily: 'Arial, sans-serif', primaryColor: '#4F46E5', textColor: '#374151', borderRadius: 12 },
    blocks: [
      { type: 'header', content: { title: '{{site.name}}' }, styles: { backgroundColor: '#ffffff', padding: 24 } },
      { type: 'hero', content: { title: 'Welcome to {{site.name}}!', subtitle: "Let's get you set up", buttonText: 'Get Started', buttonLink: '#' }, styles: { backgroundColor: '#4F46E5', textColor: '#ffffff', padding: 48 } },
      { type: 'progressBar', content: { title: 'Your Setup Progress', current: 25, goal: 100, description: 'Complete your profile to unlock all features' }, styles: { backgroundColor: '#ffffff', padding: 32 } },
      { type: 'iconList', content: { title: 'Quick Start Checklist', items: [{ icon: '1', text: 'Complete your profile' }, { icon: '2', text: 'Connect your accounts' }, { icon: '3', text: 'Invite team members' }] }, styles: { padding: 32 } },
      { type: 'cta', content: { title: 'Need Help?', subtitle: 'Our support team is here for you', buttonText: 'Contact Support' }, styles: { backgroundColor: '#f9fafb', padding: 32 } },
      { type: 'footer', content: { companyName: '{{site.name}}' }, styles: { backgroundColor: '#1f2937', padding: 32 } }
    ]
  },
  {
    id: 'saas-feature-update',
    name: 'Feature Announcement',
    category: 'saas',
    description: 'Announce new features and updates',
    thumbnail: '/templates/saas-feature.png',
    globalStyles: { backgroundColor: '#f9fafb', contentWidth: 600, fontFamily: 'Arial, sans-serif', primaryColor: '#10B981', textColor: '#374151', borderRadius: 12 },
    blocks: [
      { type: 'header', content: { title: '{{site.name}}' }, styles: { backgroundColor: '#ffffff', padding: 24 } },
      { type: 'hero', content: { title: "🚀 What's New", subtitle: 'Exciting updates just for you', buttonText: 'See All Updates' }, styles: { backgroundColor: '#10B981', textColor: '#ffffff', padding: 40 } },
      { type: 'features', content: { title: 'New Features', features: [{ icon: '✨', title: 'Feature 1', desc: 'Description' }, { icon: '⚡', title: 'Feature 2', desc: 'Description' }] }, styles: { backgroundColor: '#ffffff', padding: 32 } },
      { type: 'videoEmbed', content: { title: 'See It In Action', thumbnailUrl: '', videoUrl: '#' }, styles: { padding: 24 } },
      { type: 'footer', content: { companyName: '{{site.name}}' }, styles: { backgroundColor: '#1f2937', padding: 32 } }
    ]
  },
  {
    id: 'saas-usage-report',
    name: 'Usage Report',
    category: 'saas',
    description: 'Monthly usage and statistics',
    thumbnail: '/templates/saas-usage.png',
    globalStyles: { backgroundColor: '#f9fafb', contentWidth: 600, fontFamily: 'Arial, sans-serif', primaryColor: '#4F46E5', textColor: '#374151', borderRadius: 8 },
    blocks: [
      { type: 'header', content: { title: '{{site.name}}' }, styles: { backgroundColor: '#ffffff', padding: 24 } },
      { type: 'text', content: { text: 'Your Monthly Report - {{report.month}}' }, styles: { padding: 24, fontSize: 24, textAlign: 'center', fontWeight: 'bold' } },
      { type: 'statsGrid', content: { stats: [{ value: '{{stats.users}}', label: 'Active Users' }, { value: '{{stats.actions}}', label: 'Actions Taken' }, { value: '{{stats.growth}}', label: 'Growth' }] }, styles: { backgroundColor: '#4F46E5', textColor: '#ffffff', padding: 40 } },
      { type: 'progressBar', content: { title: 'Plan Usage', current: 65, goal: 100, description: '65% of your monthly limit used' }, styles: { backgroundColor: '#ffffff', padding: 32 } },
      { type: 'cta', content: { title: 'Need More?', subtitle: 'Upgrade your plan for unlimited access', buttonText: 'View Plans' }, styles: { backgroundColor: '#f9fafb', padding: 32 } },
      { type: 'footer', content: { companyName: '{{site.name}}' }, styles: { backgroundColor: '#1f2937', padding: 32 } }
    ]
  },

  // GENERAL TEMPLATES
  {
    id: 'general-announcement',
    name: 'Announcement',
    category: 'general',
    description: 'General announcements and updates',
    thumbnail: '/templates/general-announce.png',
    globalStyles: { backgroundColor: '#f9fafb', contentWidth: 600, fontFamily: 'Arial, sans-serif', primaryColor: '#4F46E5', textColor: '#374151', borderRadius: 8 },
    blocks: [
      { type: 'header', content: { title: '{{site.name}}' }, styles: { backgroundColor: '#ffffff', padding: 24 } },
      { type: 'hero', content: { title: 'Important Update', subtitle: 'Something exciting to share', buttonText: 'Learn More' }, styles: { backgroundColor: '#4F46E5', textColor: '#ffffff', padding: 48 } },
      { type: 'text', content: { text: 'Your message content here...' }, styles: { backgroundColor: '#ffffff', padding: 32 } },
      { type: 'cta', content: { title: 'Take Action', buttonText: 'Get Started' }, styles: { backgroundColor: '#f9fafb', padding: 32 } },
      { type: 'footer', content: { companyName: '{{site.name}}' }, styles: { backgroundColor: '#1f2937', padding: 32 } }
    ]
  }
];

