/**
 * Custom Tiptap Gallery Extension
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface GalleryOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    gallery: {
      setGallery: (options: { images: Array<{ src: string; alt?: string }> }) => ReturnType;
    };
  }
}

export const Gallery = Node.create<GalleryOptions>({
  name: 'gallery',

  group: 'block',

  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element) => {
          const imagesAttr = element.getAttribute('data-images');
          return imagesAttr ? JSON.parse(imagesAttr) : [];
        },
        renderHTML: (attributes) => {
          return {
            'data-images': JSON.stringify(attributes.images),
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="gallery"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { images } = HTMLAttributes;
    
    const imageElements = images.map((img: any) => [
      'div',
      { class: 'gallery-item' },
      ['img', { src: img.src, alt: img.alt || '' }],
    ]);

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'gallery',
        'data-images': JSON.stringify(images),
        class: 'gallery-grid',
      }),
      ...imageElements,
    ];
  },

  addCommands() {
    return {
      setGallery:
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

