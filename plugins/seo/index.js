/**
 * SEO Plugin
 * Adds meta title and description fields to posts and pages
 */

module.exports = {
  /**
   * Called when plugin is activated
   */
  onActivate: async () => {
    console.log('SEO Plugin activated');
  },

  /**
   * Called when plugin is deactivated
   */
  onDeactivate: async () => {
    console.log('SEO Plugin deactivated');
  },

  /**
   * Register custom fields for content types
   */
  registerFields: () => {
    return [
      {
        name: 'metaTitle',
        label: 'Meta Title',
        type: 'text',
        description: 'SEO title for search engines (max 60 characters)',
        maxLength: 60,
      },
      {
        name: 'metaDescription',
        label: 'Meta Description',
        type: 'textarea',
        description: 'SEO description for search engines (max 160 characters)',
        maxLength: 160,
      },
      {
        name: 'metaKeywords',
        label: 'Meta Keywords',
        type: 'text',
        description: 'Comma-separated keywords',
      },
      {
        name: 'ogImage',
        label: 'Open Graph Image',
        type: 'media',
        description: 'Image for social media sharing',
      },
    ];
  },

  /**
   * Hook: Before saving content
   * Validate SEO fields
   */
  beforeSave: async (data) => {
    // Auto-generate meta title from title if not provided
    if (!data.metaTitle && data.title) {
      data.metaTitle = data.title.substring(0, 60);
    }

    // Auto-generate meta description from excerpt or content if not provided
    if (!data.metaDescription) {
      if (data.excerpt) {
        data.metaDescription = data.excerpt.substring(0, 160);
      } else if (data.content) {
        // Strip HTML and get first 160 characters
        const plainText = data.content.replace(/<[^>]*>/g, '');
        data.metaDescription = plainText.substring(0, 160);
      }
    }

    return data;
  },
};

