/**
 * Custom Tiptap Social Media Embed Extension
 * Embeds for Twitter, Instagram, Facebook posts
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface SocialEmbedOptions {
  HTMLAttributes: Record<string, any>;
}

export type SocialPlatform = 'twitter' | 'instagram' | 'facebook';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    socialEmbed: {
      setSocialEmbed: (options: { 
        platform: SocialPlatform; 
        url: string;
        postId?: string;
      }) => ReturnType;
    };
  }
}

export const SocialEmbed = Node.create<SocialEmbedOptions>({
  name: 'socialEmbed',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      platform: { default: 'twitter' },
      url: { default: '' },
      postId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="social-embed"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    const { platform, url, postId } = HTMLAttributes;
    
    const platformStyles: Record<SocialPlatform, { icon: string; color: string; name: string }> = {
      twitter: { icon: '𝕏', color: '#000000', name: 'Twitter/X' },
      instagram: { icon: '📷', color: '#E4405F', name: 'Instagram' },
      facebook: { icon: 'f', color: '#1877F2', name: 'Facebook' },
    };

    const style = platformStyles[platform as SocialPlatform] || platformStyles.twitter;

    // Create an embed placeholder that can be hydrated on the frontend
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'social-embed',
        'data-platform': platform,
        'data-url': url,
        'data-post-id': postId,
        class: `social-embed social-embed-${platform}`,
        style: 'margin: 1.5rem 0; max-width: 550px;',
      }),
      [
        'div',
        { 
          style: `border: 1px solid #e5e7eb; border-radius: 0.75rem; overflow: hidden; background: white;`,
        },
        // Header
        [
          'div',
          { style: `display: flex; align-items: center; padding: 0.75rem 1rem; border-bottom: 1px solid #e5e7eb; background: ${style.color}11;` },
          ['span', { style: `width: 32px; height: 32px; background: ${style.color}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1rem; margin-right: 0.75rem;` }, style.icon],
          ['span', { style: 'font-weight: 500; color: #374151;' }, `${style.name} Post`],
        ],
        // Content placeholder
        [
          'div',
          { style: 'padding: 1.5rem; text-align: center;' },
          ['p', { style: 'margin: 0 0 0.75rem; color: #6b7280; font-size: 0.875rem;' }, 'Embedded post will appear here when published'],
          ['a', { 
            href: url, 
            target: '_blank',
            rel: 'noopener noreferrer',
            style: `display: inline-block; padding: 0.5rem 1rem; background: ${style.color}; color: white; border-radius: 0.375rem; text-decoration: none; font-size: 0.875rem;`,
          }, `View on ${style.name}`],
        ],
      ],
    ];
  },

  addCommands() {
    return {
      setSocialEmbed:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

