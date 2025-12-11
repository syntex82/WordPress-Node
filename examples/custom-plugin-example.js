/**
 * Example Custom Plugin: Comment Moderation
 * 
 * This plugin demonstrates how to create a custom plugin that:
 * - Adds custom fields to posts
 * - Hooks into content lifecycle events
 * - Stores plugin-specific settings
 * 
 * To use this plugin:
 * 1. Copy this directory to plugins/comment-moderation/
 * 2. Create a plugin.json file (see below)
 * 3. Scan and activate via admin panel or API
 */

module.exports = {
  /**
   * Called when the plugin is activated
   */
  onActivate: async () => {
    console.log('Comment Moderation Plugin activated');
    // You could initialize database tables, settings, etc.
  },

  /**
   * Called when the plugin is deactivated
   */
  onDeactivate: async () => {
    console.log('Comment Moderation Plugin deactivated');
    // Clean up resources if needed
  },

  /**
   * Register custom fields for posts
   * These fields will be available in the post editor
   */
  registerFields: () => {
    return [
      {
        name: 'commentsEnabled',
        label: 'Enable Comments',
        type: 'boolean',
        defaultValue: true,
      },
      {
        name: 'requireModeration',
        label: 'Require Comment Moderation',
        type: 'boolean',
        defaultValue: false,
      },
      {
        name: 'maxComments',
        label: 'Maximum Comments',
        type: 'number',
        defaultValue: 100,
      },
    ];
  },

  /**
   * Hook: Before saving a post
   * Validate and modify data before it's saved
   */
  beforeSave: async (data) => {
    console.log('Comment Moderation: Validating post data');
    
    // Example: Ensure custom fields have valid values
    if (data.customFields) {
      if (data.customFields.maxComments && data.customFields.maxComments < 0) {
        throw new Error('Maximum comments must be a positive number');
      }
    }
    
    return data;
  },

  /**
   * Hook: After saving a post
   * Perform actions after the post is saved
   */
  afterSave: async (post) => {
    console.log(`Comment Moderation: Post ${post.id} saved`);
    
    // Example: Send notification if comments are enabled
    if (post.customFields?.commentsEnabled) {
      console.log('Comments are enabled for this post');
      // You could send an email, webhook, etc.
    }
  },

  /**
   * Hook: Before deleting a post
   */
  beforeDelete: async (postId) => {
    console.log(`Comment Moderation: Preparing to delete post ${postId}`);
    // You could delete associated comments, etc.
  },

  /**
   * Hook: After deleting a post
   */
  afterDelete: async (postId) => {
    console.log(`Comment Moderation: Post ${postId} deleted`);
  },

  /**
   * Register custom routes
   * Add custom API endpoints for your plugin
   */
  registerRoutes: (app) => {
    // Example: Add a route to get comment statistics
    app.get('/api/plugins/comment-moderation/stats', async (req, res) => {
      res.json({
        totalComments: 0,
        pendingModeration: 0,
        approved: 0,
      });
    });

    // Example: Add a route to moderate a comment
    app.post('/api/plugins/comment-moderation/moderate/:id', async (req, res) => {
      const { id } = req.params;
      const { action } = req.body; // 'approve' or 'reject'
      
      res.json({
        success: true,
        message: `Comment ${id} ${action}d`,
      });
    });
  },
};

/**
 * plugin.json file for this plugin:
 * 
 * {
 *   "name": "Comment Moderation",
 *   "version": "1.0.0",
 *   "author": "Your Name",
 *   "description": "Adds comment moderation functionality to posts",
 *   "entry": "index.js",
 *   "hooks": [
 *     "onActivate",
 *     "onDeactivate",
 *     "beforeSave",
 *     "afterSave",
 *     "beforeDelete",
 *     "afterDelete",
 *     "registerFields",
 *     "registerRoutes"
 *   ],
 *   "settings": {
 *     "autoApprove": {
 *       "type": "boolean",
 *       "default": false,
 *       "label": "Auto-approve comments from registered users"
 *     },
 *     "spamFilter": {
 *       "type": "boolean",
 *       "default": true,
 *       "label": "Enable spam filtering"
 *     }
 *   }
 * }
 */

