/**
 * Tooltip Content Configuration
 * Comprehensive help text for all WordPress Node features
 */

export const NAV_TOOLTIPS = {
  // Main Navigation
  dashboard: {
    title: 'Dashboard',
    content: 'Your command center. View site stats, recent activity, quick actions, and system health at a glance.',
  },
  analytics: {
    title: 'Analytics',
    content: 'Track visitor behavior, page views, traffic sources, and conversion metrics to understand your audience.',
  },
  seo: {
    title: 'SEO Manager',
    content: 'Optimize your site for search engines. Manage meta tags, sitemaps, robots.txt, and analyze SEO scores.',
  },
  posts: {
    title: 'Blog Posts',
    content: 'Create and manage blog posts. Use the rich text editor to write engaging content with images, videos, and formatting.',
  },
  pages: {
    title: 'Static Pages',
    content: 'Create permanent pages like About, Contact, Services. Pages appear in navigation and don\'t have dates like posts.',
  },
  media: {
    title: 'Media Library',
    content: 'Upload and manage images, videos, documents. Organize with folders and use across your site.',
  },
  menus: {
    title: 'Menu Manager',
    content: 'Create navigation menus. Drag and drop to organize menu items, create dropdowns, and assign to locations.',
  },
  users: {
    title: 'User Management',
    content: 'Manage user accounts, roles, and permissions. Control who can access what in your admin panel.',
  },
  messages: {
    title: 'Messages',
    content: 'Internal messaging system. Communicate with team members and receive system notifications.',
  },
  groups: {
    title: 'Groups & Chat',
    content: 'Create group discussions, team channels, and collaborative workspaces.',
  },
  security: {
    title: 'Security Center',
    content: 'Monitor security threats, manage firewall rules, view login attempts, and configure 2FA.',
  },
  settings: {
    title: 'Site Settings',
    content: 'Configure site title, timezone, permalinks, email settings, and general preferences.',
  },

  // Shop
  products: {
    title: 'Products',
    content: 'Add and manage products for your online store. Set prices, inventory, images, and variations.',
  },
  orders: {
    title: 'Orders',
    content: 'View and process customer orders. Update order status, print invoices, and handle refunds.',
  },
  shopCategories: {
    title: 'Product Categories',
    content: 'Organize products into categories for easy navigation and filtering.',
  },

  // LMS
  lmsDashboard: {
    title: 'LMS Overview',
    content: 'Learning Management dashboard. View enrollments, completion rates, and student progress.',
  },
  courses: {
    title: 'Courses',
    content: 'Create and manage online courses. Add lessons, quizzes, and track student progress.',
  },
  lmsCategories: {
    title: 'Course Categories',
    content: 'Organize courses by subject, difficulty level, or topic.',
  },
  catalog: {
    title: 'Course Catalog',
    content: 'Public course catalog where students can browse and enroll in available courses.',
  },

  // Marketplace
  marketplaceDashboard: {
    title: 'Marketplace Overview',
    content: 'Monitor marketplace performance. View developer statistics, active projects, financial metrics, and pending payouts.',
  },
  developers: {
    title: 'Developer Management',
    content: 'Review and manage developer applications. Approve, reject, or suspend developer profiles.',
  },
  hiringRequests: {
    title: 'Hiring Requests',
    content: 'View and manage hiring requests between clients and developers. Track request status and communications.',
  },
  marketplaceProjects: {
    title: 'Marketplace Projects',
    content: 'Monitor active projects, track progress, manage milestones, and handle disputes.',
  },
  developerApplication: {
    title: 'Developer Application',
    content: 'Apply to become a marketplace developer. Set your skills, rates, and availability.',
  },
  hireDeveloper: {
    title: 'Hire Developer',
    content: 'Send a hiring request to a developer. Describe your project, set budget, and timeline.',
  },

  // Email
  emailTemplates: {
    title: 'Email Templates',
    content: 'Pre-designed email layouts. Create templates for welcome emails, notifications, and marketing.',
  },
  emailDesigner: {
    title: 'Email Designer',
    content: 'Visual drag-and-drop email builder. Design beautiful emails without coding.',
  },
  emailComposer: {
    title: 'Compose Email',
    content: 'Write and send emails to users or subscribers. Select recipients and templates.',
  },
  emailLogs: {
    title: 'Email Logs',
    content: 'Track sent emails. View delivery status, open rates, and troubleshoot issues.',
  },

  // Theme
  styleCustomizer: {
    title: 'Style Customizer',
    content: 'Customize colors, fonts, layouts, and styling. See changes in real-time preview.',
  },
  contentManager: {
    title: 'Content Manager',
    content: 'Manage theme images, content blocks, and navigation links. Organize and reorder with drag-and-drop.',
  },
  viewWebsite: {
    title: 'View Website',
    content: 'Opens your live website in a new tab to see how it looks to visitors.',
  },
  customizeTheme: {
    title: 'Theme Customizer',
    content: 'Full theme customization experience with live preview and advanced options.',
  },
};

export const FEATURE_TOOLTIPS = {
  // Common Actions
  save: { title: 'Save', content: 'Save your changes. Unsaved changes will be lost if you navigate away.', shortcut: 'Ctrl+S' },
  delete: { title: 'Delete', content: 'Permanently remove this item. This action cannot be undone.' },
  edit: { title: 'Edit', content: 'Open the editor to modify this item.' },
  duplicate: { title: 'Duplicate', content: 'Create a copy of this item with all its settings.' },
  preview: { title: 'Preview', content: 'See how this will look before publishing.' },
  publish: { title: 'Publish', content: 'Make this visible to the public on your website.' },
  draft: { title: 'Save as Draft', content: 'Save without publishing. Only visible to admins.' },
  export: { title: 'Export', content: 'Download as a file to backup or transfer to another site.' },
  import: { title: 'Import', content: 'Upload a previously exported file to restore settings.' },
  refresh: { title: 'Refresh', content: 'Reload the latest data from the server.' },
  search: { title: 'Search', content: 'Filter items by name or keyword.' },
  filter: { title: 'Filter', content: 'Show only items matching specific criteria.' },
  sort: { title: 'Sort', content: 'Change the order items are displayed.' },
  visibility: { title: 'Toggle Visibility', content: 'Show or hide this item without deleting it.' },
  dragReorder: { title: 'Drag to Reorder', content: 'Drag items to rearrange their order. Changes save automatically.' },
};

export const MARKETPLACE_TOOLTIPS = {
  // Dashboard Stats
  totalDevelopers: { title: 'Total Developers', content: 'Number of developers registered on the marketplace. Click to manage developer profiles.' },
  pendingApproval: { title: 'Pending Approval', content: 'Developers awaiting approval. Review applications to grow your marketplace.' },
  activeProjects: { title: 'Active Projects', content: 'Currently ongoing projects between clients and developers.' },
  totalEscrow: { title: 'Escrow Balance', content: 'Total funds held in escrow for active projects. Released when milestones are completed.' },
  platformFees: { title: 'Platform Fees', content: 'Total fees earned from marketplace transactions.' },

  // Actions
  approveDeveloper: { title: 'Approve', content: 'Approve this developer application. They will be able to receive hiring requests.' },
  rejectDeveloper: { title: 'Reject', content: 'Reject this developer application. They can reapply after making improvements.' },
  suspendDeveloper: { title: 'Suspend', content: 'Temporarily suspend this developer. They cannot accept new projects.' },
  reactivateDeveloper: { title: 'Reactivate', content: 'Reactivate a suspended developer account.' },
  viewStatistics: { title: 'View Statistics', content: 'See detailed marketplace analytics and performance metrics.' },
  viewDetails: { title: 'View Details', content: 'Open detailed view for this item.' },

  // Filters
  statusFilter: { title: 'Filter by Status', content: 'Show only items with a specific status.' },
  categoryFilter: { title: 'Filter by Category', content: 'Show developers or projects in a specific category.' },
  roleToggle: { title: 'Switch View', content: 'Toggle between client and developer perspectives.' },
  clearFilters: { title: 'Clear Filters', content: 'Reset all filters to show all items.' },

  // Projects
  projectProgress: { title: 'Project Progress', content: 'Completion percentage based on completed milestones.' },
  escrowAmount: { title: 'In Escrow', content: 'Funds secured for this project, released upon milestone completion.' },

  // Forms - Developer Application
  displayName: { title: 'Display Name', content: 'Your public name shown to clients on the marketplace.' },
  headline: { title: 'Professional Headline', content: 'A brief tagline describing your expertise (e.g., "Senior Full-Stack Developer").' },
  category: { title: 'Category', content: 'Your primary area of expertise. This helps clients find you.' },
  skills: { title: 'Skills', content: 'List your key skills separated by commas. These are searchable by clients.' },
  hourlyRate: { title: 'Hourly Rate', content: 'Your standard hourly rate. Clients see this when browsing developers.' },
  minimumBudget: { title: 'Minimum Budget', content: 'Minimum project budget you\'re willing to accept.' },

  // Forms - Hire Developer
  projectTitle: { title: 'Project Title', content: 'A clear, descriptive title for your project.' },
  projectDescription: { title: 'Project Description', content: 'Detailed description of what you need built. Be specific about features and requirements.' },
  budgetType: { title: 'Budget Type', content: 'Fixed price for defined scope, or hourly for ongoing work.' },
  budgetAmount: { title: 'Budget Amount', content: 'Your budget for this project. Be realistic to attract quality developers.' },
  estimatedHours: { title: 'Estimated Hours', content: 'Approximate hours needed to complete the project.' },
  deadline: { title: 'Deadline', content: 'Expected completion date for the project.' },
};

