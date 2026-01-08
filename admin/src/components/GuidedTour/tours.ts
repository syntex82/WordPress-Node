import { TourConfig } from './GuidedTour';

/**
 * Welcome Tour - Introduction to NodePress
 */
export const welcomeTour: TourConfig = {
  id: 'welcome',
  name: 'Welcome to NodePress',
  description: 'Get started with the basics of NodePress CMS',
  steps: [
    {
      id: 'welcome-intro',
      target: 'body',
      title: 'Welcome to NodePress! 🎉',
      content: 'NodePress is a powerful, modern CMS built for creators and businesses. Let\'s take a quick tour to help you get started.',
      placement: 'center',
    },
    {
      id: 'dashboard',
      target: '[data-tour="dashboard"]',
      title: 'Your Dashboard',
      content: 'This is your command center. View site stats, recent activity, and quick actions all in one place.',
      placement: 'right',
      route: '/',
    },
    {
      id: 'sidebar',
      target: '[data-tour="sidebar"]',
      title: 'Navigation Sidebar',
      content: 'Access all features from here: content, media, shop, courses, and settings. Click any section to expand it.',
      placement: 'right',
    },
    {
      id: 'posts',
      target: '[data-tour="posts"]',
      title: 'Create Content',
      content: 'Write blog posts, articles, and news. Use the rich editor with AI assistance to create engaging content.',
      placement: 'right',
      route: '/posts',
    },
    {
      id: 'pages',
      target: '[data-tour="pages"]',
      title: 'Build Pages',
      content: 'Create static pages like About, Contact, and Services. Use the visual editor for complete control.',
      placement: 'right',
    },
    {
      id: 'media',
      target: '[data-tour="media"]',
      title: 'Media Library',
      content: 'Upload and manage images, videos, and files. Drag and drop for easy uploads.',
      placement: 'right',
      route: '/media',
    },
    {
      id: 'themes',
      target: '[data-tour="themes"]',
      title: 'Theme Designer',
      content: 'Customize your site\'s look with our visual theme designer. Or use AI to generate a complete theme!',
      placement: 'right',
    },
    {
      id: 'complete',
      target: 'body',
      title: 'You\'re All Set! 🚀',
      content: 'You now know the basics. Explore each section to discover more features. Need help? Check the documentation or contact support.',
      placement: 'center',
    },
  ],
};

/**
 * Content Creation Tour
 */
export const contentTour: TourConfig = {
  id: 'content',
  name: 'Content Creation',
  description: 'Learn how to create and manage content',
  steps: [
    {
      id: 'posts-list',
      target: '[data-tour="posts-list"]',
      title: 'Your Posts',
      content: 'View all your posts here. Filter by status, search, and sort to find what you need.',
      placement: 'bottom',
      route: '/posts',
    },
    {
      id: 'new-post',
      target: '[data-tour="new-post-btn"]',
      title: 'Create New Post',
      content: 'Click here to start writing a new post. You\'ll get a powerful editor with formatting tools.',
      placement: 'left',
    },
    {
      id: 'post-editor',
      target: '[data-tour="post-editor"]',
      title: 'Rich Text Editor',
      content: 'Write your content here. Use the toolbar for formatting, add images, embed videos, and more.',
      placement: 'bottom',
      route: '/posts/new',
    },
    {
      id: 'post-settings',
      target: '[data-tour="post-settings"]',
      title: 'Post Settings',
      content: 'Set categories, tags, featured image, SEO settings, and publishing options.',
      placement: 'left',
    },
    {
      id: 'ai-assist',
      target: '[data-tour="ai-assist"]',
      title: 'AI Writing Assistant',
      content: 'Use AI to help write, improve, or translate your content. Just describe what you need!',
      placement: 'left',
    },
  ],
};

/**
 * E-Commerce Tour
 */
export const shopTour: TourConfig = {
  id: 'shop',
  name: 'E-Commerce Setup',
  description: 'Set up your online store',
  steps: [
    {
      id: 'products',
      target: '[data-tour="products"]',
      title: 'Product Management',
      content: 'Add and manage your products here. Set prices, inventory, images, and variants.',
      placement: 'right',
      route: '/shop/products',
    },
    {
      id: 'add-product',
      target: '[data-tour="add-product-btn"]',
      title: 'Add Products',
      content: 'Click to add a new product. Fill in details, upload images, and set pricing.',
      placement: 'left',
    },
    {
      id: 'orders',
      target: '[data-tour="orders"]',
      title: 'Order Management',
      content: 'View and manage customer orders. Update status, process refunds, and track shipments.',
      placement: 'right',
      route: '/shop/orders',
    },
    {
      id: 'categories',
      target: '[data-tour="shop-categories"]',
      title: 'Product Categories',
      content: 'Organize products into categories for easy browsing.',
      placement: 'right',
      route: '/shop/categories',
    },
  ],
};

/**
 * LMS Tour
 */
export const lmsTour: TourConfig = {
  id: 'lms',
  name: 'Course Creation',
  description: 'Create and sell online courses',
  steps: [
    {
      id: 'courses',
      target: '[data-tour="courses"]',
      title: 'Your Courses',
      content: 'Manage all your courses here. Create new courses, edit content, and track enrollments.',
      placement: 'right',
      route: '/lms/courses',
    },
    {
      id: 'new-course',
      target: '[data-tour="new-course-btn"]',
      title: 'Create a Course',
      content: 'Start building your course. Add modules, lessons, quizzes, and certificates.',
      placement: 'left',
    },
    {
      id: 'curriculum',
      target: '[data-tour="curriculum"]',
      title: 'Curriculum Builder',
      content: 'Organize your course content with drag-and-drop. Add video lessons, text, quizzes, and assignments.',
      placement: 'bottom',
    },
    {
      id: 'student-dashboard',
      target: '[data-tour="student-dashboard"]',
      title: 'Student Experience',
      content: 'Preview how students will see and interact with your course.',
      placement: 'right',
      route: '/lms/dashboard',
    },
  ],
};

/**
 * Theme Customization Tour
 */
export const themeTour: TourConfig = {
  id: 'theme',
  name: 'Theme Customization',
  description: 'Customize your site\'s appearance',
  steps: [
    {
      id: 'theme-designer',
      target: '[data-tour="theme-designer"]',
      title: 'Theme Designer',
      content: 'Design your site visually. Add blocks, customize colors, fonts, and layouts.',
      placement: 'right',
      route: '/theme-designer',
    },
    {
      id: 'ai-theme',
      target: '[data-tour="ai-theme-btn"]',
      title: 'AI Theme Generator',
      content: 'Describe your ideal website and AI will create a complete theme for you!',
      placement: 'bottom',
    },
    {
      id: 'blocks',
      target: '[data-tour="block-library"]',
      title: 'Block Library',
      content: 'Choose from dozens of pre-built blocks: heroes, features, pricing, testimonials, and more.',
      placement: 'left',
    },
    {
      id: 'preview',
      target: '[data-tour="preview"]',
      title: 'Live Preview',
      content: 'See your changes in real-time. Switch between desktop, tablet, and mobile views.',
      placement: 'top',
    },
  ],
};

/**
 * Demo-specific tour for potential customers
 */
export const demoTour: TourConfig = {
  id: 'demo',
  name: 'NodePress Demo Tour',
  description: 'Explore what NodePress can do for you',
  steps: [
    {
      id: 'demo-welcome',
      target: 'body',
      title: 'Welcome to Your Demo! 🎉',
      content: 'This is a fully-functional NodePress instance. Explore all features - create content, design themes, set up a shop, and more!',
      placement: 'center',
    },
    {
      id: 'demo-dashboard',
      target: '[data-tour="dashboard"]',
      title: 'Dashboard Overview',
      content: 'Your dashboard shows site analytics, recent activity, and quick actions. Everything you need at a glance.',
      placement: 'right',
      route: '/',
    },
    {
      id: 'demo-ai-theme',
      target: '[data-tour="theme-designer"]',
      title: '✨ AI Theme Generator',
      content: 'Our most popular feature! Describe your ideal website and AI creates a complete, professional theme in seconds.',
      placement: 'right',
      route: '/theme-designer',
    },
    {
      id: 'demo-shop',
      target: '[data-tour="shop"]',
      title: 'E-Commerce Built-In',
      content: 'Full e-commerce with products, orders, payments, and shipping. No plugins needed!',
      placement: 'right',
    },
    {
      id: 'demo-lms',
      target: '[data-tour="lms"]',
      title: 'Learning Management',
      content: 'Create and sell online courses with video lessons, quizzes, certificates, and student tracking.',
      placement: 'right',
    },
    {
      id: 'demo-upgrade',
      target: 'body',
      title: 'Ready to Get Started?',
      content: 'Your demo expires in 24 hours. Upgrade now to keep your work and unlock all features. Our team is here to help!',
      placement: 'center',
    },
  ],
};

// Export all tours
export const tours = {
  welcome: welcomeTour,
  content: contentTour,
  shop: shopTour,
  lms: lmsTour,
  theme: themeTour,
  demo: demoTour,
};

export type TourId = keyof typeof tours;

