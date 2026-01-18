/**
 * Server-side HTML Sanitization Utility
 * Uses sanitize-html to prevent XSS attacks
 */

import * as sanitizeHtml from 'sanitize-html';

/**
 * Sanitize HTML content for general use
 */
export function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  return sanitizeHtml(html, {
    allowedTags: [
      'a', 'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'div', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'img', 'figure', 'figcaption', 'video', 'audio', 'source',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'sub', 'sup', 'mark', 'del', 'ins',
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'rel', 'title'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      'video': ['src', 'controls', 'autoplay', 'loop', 'muted', 'poster', 'width', 'height'],
      'audio': ['src', 'controls', 'autoplay', 'loop', 'muted'],
      'source': ['src', 'type'],
      '*': ['class', 'id', 'style'],
    },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesByTag: {
      img: ['http', 'https', 'data'],
    },
  });
}

/**
 * Sanitize HTML for ad content (more restrictive)
 */
export function sanitizeAdHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  return sanitizeHtml(html, {
    allowedTags: ['a', 'img', 'div', 'span', 'p', 'br', 'strong', 'em'],
    allowedAttributes: {
      'a': ['href', 'target', 'rel', 'title'],
      'img': ['src', 'alt', 'title', 'width', 'height'],
      '*': ['class', 'style'],
    },
    allowedSchemes: ['http', 'https'],
    transformTags: {
      'a': (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          target: '_blank',
          rel: 'noopener noreferrer sponsored',
        },
      }),
    },
  });
}

/**
 * Sanitize HTML for email content
 */
export function sanitizeEmailHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  return sanitizeHtml(html, {
    allowedTags: [
      'a', 'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'div', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote',
      'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'center',
    ],
    allowedAttributes: {
      'a': ['href', 'target', 'title'],
      'img': ['src', 'alt', 'title', 'width', 'height', 'border'],
      'table': ['width', 'border', 'cellpadding', 'cellspacing', 'align', 'bgcolor'],
      'td': ['width', 'height', 'align', 'valign', 'bgcolor', 'colspan', 'rowspan'],
      'th': ['width', 'height', 'align', 'valign', 'bgcolor', 'colspan', 'rowspan'],
      '*': ['class', 'id', 'style'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
  });
}

/**
 * Validate and sanitize redirect URLs to prevent open redirects
 * Only allows relative paths or URLs to the same origin
 */
export function safeRedirectUrl(url: string | undefined, defaultUrl: string = '/'): string {
  if (!url || typeof url !== 'string') {
    return defaultUrl;
  }

  // Trim whitespace
  const trimmed = url.trim();

  // Block empty strings
  if (!trimmed) {
    return defaultUrl;
  }

  // Block URLs starting with // (protocol-relative) or containing :// (absolute URLs)
  if (trimmed.startsWith('//') || trimmed.includes('://')) {
    return defaultUrl;
  }

  // Block javascript: and data: schemes
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return defaultUrl;
  }

  // Block URLs with @ (which could be used for URL confusion attacks)
  if (trimmed.includes('@')) {
    return defaultUrl;
  }

  // Block backslash (Windows path separator that some browsers interpret as /)
  if (trimmed.includes('\\')) {
    return defaultUrl;
  }

  // Only allow paths that start with / (relative to root)
  if (!trimmed.startsWith('/')) {
    return defaultUrl;
  }

  // Additional check: block paths that could escape (though starting with / should be safe)
  if (trimmed.includes('..')) {
    return defaultUrl;
  }

  return trimmed;
}

export default { sanitizeHtmlContent, sanitizeAdHtml, sanitizeEmailHtml, safeRedirectUrl };

