/**
 * NodePress Analytics Tracker - Lightweight Privacy-First Analytics
 * ~3KB minified, no external dependencies, GDPR compliant
 *
 * Usage:
 * <script src="/api/analytics/tracker.js" data-api="/api/analytics" defer></script>
 * Or manually:
 * <script>
 *   NodeAnalytics.init({ apiUrl: '/api/analytics' });
 *   NodeAnalytics.trackEvent('button', 'click', 'signup-button');
 * </script>
 */

(function(w, d) {
  'use strict';

  // Minimal fingerprint for cookie-less visitor identification
  const generateVisitorId = () => {
    const nav = w.navigator;
    const screen = w.screen;
    const data = [
      nav.userAgent,
      nav.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      nav.hardwareConcurrency || 0,
    ].join('|');
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data.charCodeAt(i);
      hash = hash & hash;
    }
    return 'v_' + Math.abs(hash).toString(36) + '_' + Date.now().toString(36);
  };

  // Get UTM parameters from URL
  const getUtmParams = () => {
    const params = new URLSearchParams(w.location.search);
    return {
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      utmTerm: params.get('utm_term'),
      utmContent: params.get('utm_content'),
    };
  };

  // Throttle function for scroll tracking
  const throttle = (fn, wait) => {
    let last = 0;
    return function(...args) {
      const now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn.apply(this, args);
      }
    };
  };

  const NodeAnalytics = {
    config: {
      apiUrl: '/api/analytics',
      trackPageViews: true,
      trackScrollDepth: true,
      trackClicks: true,
      trackWebVitals: true,
      sessionTimeout: 30 * 60 * 1000,
      respectDNT: true, // Respect Do Not Track
    },
    sessionId: null,
    visitorId: null,
    pageViewId: null,
    startTime: null,
    maxScrollDepth: 0,
    interactions: 0,
    vitals: [],
    isVisible: true,
    activeTime: 0,
    lastActiveTime: null,

    init: function(options) {
      // Respect Do Not Track
      if (this.config.respectDNT && w.navigator.doNotTrack === '1') {
        console.log('Analytics: Respecting Do Not Track preference');
        return;
      }

      Object.assign(this.config, options || {});
      this.visitorId = this.getVisitorId();
      this.startTime = Date.now();
      this.lastActiveTime = Date.now();

      // Initialize session
      this.initSession();
    },

    getVisitorId: function() {
      try {
        let id = localStorage.getItem('np_visitor_id');
        if (!id) {
          id = generateVisitorId();
          localStorage.setItem('np_visitor_id', id);
        }
        return id;
      } catch {
        return generateVisitorId();
      }
    },

    initSession: async function() {
      try {
        const stored = localStorage.getItem('np_session');
        if (stored) {
          const session = JSON.parse(stored);
          if (Date.now() - session.lastActivity < this.config.sessionTimeout) {
            this.sessionId = session.id;
            session.lastActivity = Date.now();
            localStorage.setItem('np_session', JSON.stringify(session));
          }
        }

        if (!this.sessionId) {
          await this.createSession();
        }

        this.setupTracking();
      } catch (e) {
        this.setupTracking();
      }
    },

    createSession: async function() {
      try {
        const utm = getUtmParams();
        const response = await fetch(this.config.apiUrl + '/track/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: w.location.pathname,
            visitorId: this.visitorId,
            screenWidth: w.screen.width,
            screenHeight: w.screen.height,
            language: w.navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            ...utm,
          }),
        });
        const data = await response.json();
        this.sessionId = data.sessionId;
        localStorage.setItem('np_session', JSON.stringify({
          id: data.sessionId,
          lastActivity: Date.now(),
        }));
      } catch (e) {
        // Silent fail - analytics shouldn't break the page
      }
    },

    setupTracking: function() {
      if (this.config.trackPageViews) this.trackPageView();
      if (this.config.trackScrollDepth) this.initScrollTracking();
      if (this.config.trackClicks) this.initClickTracking();
      if (this.config.trackWebVitals) this.initWebVitals();

      this.initVisibilityTracking();
      this.initActivityTracking();

      w.addEventListener('beforeunload', () => this.onPageLeave());
      w.addEventListener('pagehide', () => this.onPageLeave());
    },

    trackPageView: async function() {
      try {
        const utm = getUtmParams();
        const response = await fetch(this.config.apiUrl + '/track/pageview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: w.location.pathname + w.location.search,
            sessionId: this.sessionId,
            visitorId: this.visitorId,
            ...utm,
          }),
        });
        const data = await response.json();
        this.pageViewId = data.id;
      } catch (e) {
        // Silent fail
      }
    },

    trackEvent: function(category, action, label, value, metadata) {
      const data = {
        category,
        action,
        label,
        value,
        path: w.location.pathname,
        sessionId: this.sessionId,
        metadata,
      };

      // Use sendBeacon for fire-and-forget
      if (w.navigator.sendBeacon) {
        w.navigator.sendBeacon(
          this.config.apiUrl + '/track/event',
          JSON.stringify(data)
        );
      } else {
        fetch(this.config.apiUrl + '/track/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true,
        }).catch(() => {});
      }
    },

    trackConversion: function(goalId, value, metadata) {
      fetch(this.config.apiUrl + '/track/conversion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          sessionId: this.sessionId,
          path: w.location.pathname,
          value,
          metadata,
        }),
        keepalive: true,
      }).catch(() => {});
    },

    trackSearch: function(query, resultsCount) {
      fetch(this.config.apiUrl + '/track/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          query,
          resultsCount,
        }),
        keepalive: true,
      }).catch(() => {});
    },

    initScrollTracking: function() {
      const handleScroll = throttle(() => {
        const scrollTop = w.scrollY || d.documentElement.scrollTop;
        const docHeight = d.documentElement.scrollHeight - w.innerHeight;
        const scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
        this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercent);
        this.interactions++;
      }, 250);

      w.addEventListener('scroll', handleScroll, { passive: true });
    },

    initClickTracking: function() {
      d.addEventListener('click', (e) => {
        this.interactions++;
        const target = e.target.closest('a, button, [data-track]');
        if (target) {
          const trackData = target.dataset.track;
          if (trackData) {
            const [category, action, label] = trackData.split(':');
            this.trackEvent(category || 'click', action || 'click', label || target.textContent?.slice(0, 50));
          } else if (target.tagName === 'A' && target.href) {
            const isExternal = target.hostname !== w.location.hostname;
            if (isExternal) {
              this.trackEvent('outbound', 'click', target.href);
            }
          }
        }
      }, { passive: true });

      // Track form submissions
      d.addEventListener('submit', (e) => {
        const form = e.target;
        if (form.tagName === 'FORM') {
          this.trackEvent('form', 'submit', form.id || form.action || 'unknown');
        }
      });

      // Track file downloads
      d.addEventListener('click', (e) => {
        const link = e.target.closest('a[href]');
        if (link) {
          const href = link.href.toLowerCase();
          const downloadExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.rar', '.tar', '.gz'];
          if (downloadExts.some(ext => href.endsWith(ext))) {
            this.trackEvent('download', 'click', link.href);
          }
        }
      }, { passive: true });
    },

    initWebVitals: function() {
      // Core Web Vitals tracking
      if ('PerformanceObserver' in w) {
        // Largest Contentful Paint
        try {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            this.vitals.push({ metric: 'LCP', value: lastEntry.startTime, rating: this.rateMetric('LCP', lastEntry.startTime) });
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        } catch (e) {}

        // First Input Delay
        try {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
              this.vitals.push({ metric: 'FID', value: entry.processingStart - entry.startTime, rating: this.rateMetric('FID', entry.processingStart - entry.startTime) });
            });
          }).observe({ type: 'first-input', buffered: true });
        } catch (e) {}

        // Cumulative Layout Shift
        try {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
              if (!entry.hadRecentInput) clsValue += entry.value;
            });
            this.vitals.push({ metric: 'CLS', value: clsValue, rating: this.rateMetric('CLS', clsValue) });
          }).observe({ type: 'layout-shift', buffered: true });
        } catch (e) {}

        // Time to First Byte
        try {
          const navEntry = performance.getEntriesByType('navigation')[0];
          if (navEntry) {
            const ttfb = navEntry.responseStart - navEntry.requestStart;
            this.vitals.push({ metric: 'TTFB', value: ttfb, rating: this.rateMetric('TTFB', ttfb) });
          }
        } catch (e) {}

        // First Contentful Paint
        try {
          const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
          if (fcpEntry) {
            this.vitals.push({ metric: 'FCP', value: fcpEntry.startTime, rating: this.rateMetric('FCP', fcpEntry.startTime) });
          }
        } catch (e) {}
      }
    },

    rateMetric: function(metric, value) {
      const thresholds = {
        LCP: [2500, 4000],
        FID: [100, 300],
        CLS: [0.1, 0.25],
        FCP: [1800, 3000],
        TTFB: [800, 1800],
        INP: [200, 500],
      };
      const [good, poor] = thresholds[metric] || [0, 0];
      if (value <= good) return 'good';
      if (value <= poor) return 'needs-improvement';
      return 'poor';
    },

    initVisibilityTracking: function() {
      d.addEventListener('visibilitychange', () => {
        if (d.hidden) {
          this.isVisible = false;
          this.activeTime += Date.now() - this.lastActiveTime;
        } else {
          this.isVisible = true;
          this.lastActiveTime = Date.now();
        }
      });
    },

    initActivityTracking: function() {
      setInterval(() => {
        try {
          const stored = localStorage.getItem('np_session');
          if (stored) {
            const session = JSON.parse(stored);
            session.lastActivity = Date.now();
            localStorage.setItem('np_session', JSON.stringify(session));
          }
        } catch (e) {}
      }, 60000);
    },

    onPageLeave: function() {
      if (this.isVisible) {
        this.activeTime += Date.now() - this.lastActiveTime;
      }
      const duration = Math.round(this.activeTime / 1000);

      const data = JSON.stringify({
        pageViewId: this.pageViewId,
        sessionId: this.sessionId,
        duration,
        scrollDepth: this.maxScrollDepth,
        interactions: this.interactions,
      });

      if (w.navigator.sendBeacon) {
        w.navigator.sendBeacon(this.config.apiUrl + '/track/update', data);
      }

      // Send web vitals
      if (this.vitals.length > 0) {
        const vitalsData = JSON.stringify({
          sessionId: this.sessionId,
          path: w.location.pathname,
          metrics: this.vitals,
        });
        if (w.navigator.sendBeacon) {
          w.navigator.sendBeacon(this.config.apiUrl + '/track/vitals', vitalsData);
        }
      }
    },
  };

  // Auto-init from script data attributes
  const script = d.currentScript || d.querySelector('script[data-api]');
  if (script && script.dataset.api) {
    w.addEventListener('DOMContentLoaded', () => {
      NodeAnalytics.init({ apiUrl: script.dataset.api });
    });
  }

  w.NodeAnalytics = NodeAnalytics;
  w.WPAnalytics = NodeAnalytics; // Backward compatibility
})(window, document);

