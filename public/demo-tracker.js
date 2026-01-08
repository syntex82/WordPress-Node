/**
 * NodePress Demo Analytics Tracker
 * Embeds in demo instances to track feature usage
 * 
 * Usage:
 *   <script src="/demo-tracker.js" data-token="demo-access-token"></script>
 */

(function() {
  'use strict';

  var DemoTracker = {
    accessToken: null,
    apiUrl: '/api/demos/track',
    sessionStart: Date.now(),
    pageViews: 0,
    features: {},

    init: function() {
      // Get access token from script tag or localStorage
      var script = document.currentScript || document.querySelector('script[data-token]');
      this.accessToken = script?.getAttribute('data-token') || localStorage.getItem('demo_token');
      
      if (!this.accessToken) {
        console.log('[Demo Tracker] No access token found');
        return;
      }

      this.setupEventListeners();
      this.trackPageView();
      console.log('[Demo Tracker] Initialized');
    },

    setupEventListeners: function() {
      var self = this;

      // Track navigation
      window.addEventListener('popstate', function() {
        self.trackPageView();
      });

      // Track clicks on feature elements
      document.addEventListener('click', function(e) {
        var target = e.target.closest('[data-demo-feature]');
        if (target) {
          self.track(target.dataset.demoFeature, 'click', {
            element: target.tagName,
            text: target.textContent?.substring(0, 50)
          });
        }
      });

      // Track form submissions
      document.addEventListener('submit', function(e) {
        var form = e.target;
        if (form.hasAttribute('data-demo-feature')) {
          self.track(form.dataset.demoFeature, 'submit', {
            formId: form.id || form.name
          });
        }
      });

      // Track before unload - send session duration
      window.addEventListener('beforeunload', function() {
        self.track('session', 'end', {
          duration: Math.round((Date.now() - self.sessionStart) / 1000),
          pageViews: self.pageViews,
          features: Object.keys(self.features)
        });
      });
    },

    trackPageView: function() {
      this.pageViews++;
      var page = window.location.pathname;
      
      // Map paths to features
      var featureMap = {
        '/admin/posts': 'content_management',
        '/admin/pages': 'content_management',
        '/admin/media': 'media_library',
        '/admin/shop': 'ecommerce',
        '/admin/lms': 'lms',
        '/admin/customize': 'theme_designer',
        '/admin/theme-designer': 'theme_designer',
        '/admin/ai-theme': 'ai_theme_generator',
        '/admin/analytics': 'analytics',
        '/admin/seo': 'seo_tools',
        '/admin/email': 'email_system',
        '/admin/security': 'security',
        '/admin/settings': 'settings',
      };

      for (var path in featureMap) {
        if (page.startsWith(path)) {
          this.track(featureMap[path], 'view', { page: page });
          break;
        }
      }
    },

    track: function(feature, action, metadata) {
      if (!this.accessToken) return;

      // Record locally
      this.features[feature] = (this.features[feature] || 0) + 1;

      // Send to API
      var payload = {
        accessToken: this.accessToken,
        feature: feature,
        action: action,
        metadata: metadata || {}
      };

      // Use sendBeacon for reliability on page unload
      if (action === 'end' && navigator.sendBeacon) {
        navigator.sendBeacon(this.apiUrl, JSON.stringify(payload));
      } else {
        fetch(this.apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(function() {
          // Silently fail - don't disrupt demo experience
        });
      }
    },

    // Public API for manual tracking
    trackFeature: function(feature, action, metadata) {
      this.track(feature, action || 'use', metadata);
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      DemoTracker.init();
    });
  } else {
    DemoTracker.init();
  }

  // Expose globally
  window.DemoTracker = DemoTracker;
})();

