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

export default { sanitizeHtmlContent, sanitizeAdHtml, sanitizeEmailHtml };

