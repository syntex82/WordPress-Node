/**
 * Custom Tiptap Audio Extension
 */

import { Node, mergeAttributes } from '@tiptap/core';

export interface AudioOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    audio: {
      setAudio: (options: { src: string; caption?: string }) => ReturnType;
    };
  }
}

export const Audio = Node.create<AudioOptions>({
  name: 'audio',

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
        tag: 'figure[data-type="audio"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { src, caption, controls } = HTMLAttributes;
    
    return [
      'figure',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-type': 'audio',
        class: 'audio-figure',
      }),
      [
        'audio',
        {
          src,
          controls: controls ? 'controls' : undefined,
          style: 'width: 100%;',
        },
      ],
      caption ? ['figcaption', {}, caption] : '',
    ];
  },

  addCommands() {
    return {
      setAudio:
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

