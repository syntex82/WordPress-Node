/**
 * Custom Tiptap Image Extension with Caption and Alignment
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface ImageWithCaptionOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageWithCaption: {
      setImageWithCaption: (options: { src: string; alt?: string; caption?: string; align?: string }) => ReturnType;
    };
  }
}

export const ImageWithCaption = Node.create<ImageWithCaptionOptions>({
  name: 'imageWithCaption',

  group: 'block',

  content: 'inline*',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      caption: {
        default: null,
      },
      align: {
        default: 'center',
      },
      width: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="image-with-caption"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, alt, caption, align } = HTMLAttributes;
    
    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'image-with-caption',
        class: `image-figure align-${align}`,
      }),
      [
        'img',
        {
          src,
          alt: alt || '',
        },
      ],
      caption ? ['figcaption', {}, caption] : '',
    ];
  },

  addCommands() {
    return {
      setImageWithCaption:
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

