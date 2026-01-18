/**
 * HTML Sanitization Utility
 * Uses DOMPurify to sanitize HTML content and prevent XSS attacks
 */

import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'a', 'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'div', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'img', 'figure', 'figcaption', 'video', 'audio', 'source',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'sub', 'sup', 'mark', 'del', 'ins',
      'iframe', // For embedded content like YouTube
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'target', 'rel', 'width', 'height', 'controls', 'autoplay',
      'loop', 'muted', 'poster', 'preload', 'type',
      'colspan', 'rowspan', 'scope',
      'frameborder', 'allowfullscreen', 'allow', // For iframes
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'], // Allow target attribute for links
  });
}

/**
 * Sanitize HTML for email content (more restrictive)
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeEmailHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'a', 'b', 'i', 'u', 'em', 'strong', 'p', 'br', 'div', 'span',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote',
      'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'center',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id', 'style',
      'width', 'height', 'border', 'cellpadding', 'cellspacing',
      'align', 'valign', 'bgcolor',
    ],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize HTML for ad content (very restrictive)
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export function sanitizeAdHtml(html: string): string {
  if (!html || typeof html !== 'string') {
    return '';
  }
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'a', 'img', 'div', 'span', 'p', 'br', 'strong', 'em',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'style',
      'target', 'rel', 'width', 'height',
    ],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target'],
  });
}

export default { sanitizeHtml, sanitizeEmailHtml, sanitizeAdHtml };

