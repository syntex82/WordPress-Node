/**
 * Custom Tiptap Video Extension
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface VideoOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string; caption?: string }) => ReturnType;
    };
  }
}

export const Video = Node.create<VideoOptions>({
  name: 'video',

  group: 'block',

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
      caption: {
        default: null,
      },
      controls: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="video"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, caption, controls } = HTMLAttributes;
    
    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'video',
        class: 'video-figure',
      }),
      [
        'video',
        {
          src,
          controls: controls ? 'controls' : undefined,
          style: 'max-width: 100%; height: auto;',
        },
      ],
      caption ? ['figcaption', {}, caption] : '',
    ];
  },

  addCommands() {
    return {
      setVideo:
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

