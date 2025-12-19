/**
 * Enhanced Rich Text Editor Component
 * WYSIWYG editor using Tiptap with media support and interactive content blocks
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import TextAlign from '@tiptap/extension-text-align';
import Blockquote from '@tiptap/extension-blockquote';
import Highlight from '@tiptap/extension-highlight';
import { ImageWithCaption } from './tiptap/ImageWithCaption';
import { Video } from './tiptap/Video';
import { Audio } from './tiptap/Audio';
import { Gallery } from './tiptap/Gallery';
import { Button } from './tiptap/Button';
import { Alert } from './tiptap/Alert';
import { CallToAction } from './tiptap/CallToAction';
import { Divider } from './tiptap/Divider';
import { Card } from './tiptap/Card';
import { Testimonial } from './tiptap/Testimonial';
import { Accordion } from './tiptap/Accordion';
import { Tabs } from './tiptap/Tabs';
import { ProgressBar } from './tiptap/ProgressBar';
import { SocialEmbed } from './tiptap/SocialEmbed';
import { TableOfContents } from './tiptap/TableOfContents';
import { Countdown } from './tiptap/Countdown';
import { IconBlock } from './tiptap/IconBlock';
import {
  FiBold, FiItalic, FiList, FiCode, FiImage as FiImageIcon,
  FiLink, FiAlignLeft, FiAlignCenter, FiAlignRight, FiVideo,
  FiMusic, FiYoutube, FiSquare, FiMessageSquare, FiShoppingBag,
  FiPlus, FiTrash2
} from 'react-icons/fi';
import { useEffect, useState } from 'react';
import MediaPickerModal from './MediaPickerModal';
import ShopLinkPickerModal from './ShopLinkPickerModal';
import ContentBlockPicker from './ContentBlockPicker';
import {
  AlertConfigModal, ButtonConfigModal, DividerConfigModal, CTAConfigModal,
  SocialConfigModal, CardConfigModal, TestimonialConfigModal, AccordionConfigModal,
  ProgressConfigModal, CountdownConfigModal
} from './BlockConfigModals';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

type BlockConfigModal = 'alert' | 'button' | 'divider' | 'cta' | 'social' | 'card' | 'testimonial' | 'accordion' | 'progress' | 'countdown' | null;

export default function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerType, setMediaPickerType] = useState<'image' | 'video' | 'audio' | 'gallery'>('image');
  const [showShopLinkPicker, setShowShopLinkPicker] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [activeConfigModal, setActiveConfigModal] = useState<BlockConfigModal>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
      }),
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Youtube.configure({
        width: 640,
        height: 360,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Blockquote,
      Highlight,
      ImageWithCaption,
      Video,
      Audio,
      Gallery,
      Button,
      Alert,
      CallToAction,
      Divider,
      Card,
      Testimonial,
      Accordion,
      Tabs,
      ProgressBar,
      SocialEmbed,
      TableOfContents,
      Countdown,
      IconBlock,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4 prose-invert',
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addYouTube = () => {
    const url = window.prompt('Enter YouTube URL:');
    if (url) {
      editor.commands.setYoutubeVideo({ src: url });
    }
  };

  const addButton = () => {
    const text = window.prompt('Button text:');
    const url = window.prompt('Button URL:');
    if (text && url) {
      editor.commands.setButton({ text, url, style: 'primary' });
    }
  };

  const handleMediaSelect = (media: any) => {
    if (mediaPickerType === 'image') {
      const caption = window.prompt('Image caption (optional):');
      editor.commands.setImageWithCaption({
        src: media.path,
        alt: media.originalName,
        caption: caption || '',
        align: 'center',
      });
    } else if (mediaPickerType === 'video') {
      const caption = window.prompt('Video caption (optional):');
      editor.commands.setVideo({
        src: media.path,
        caption: caption || '',
      });
    } else if (mediaPickerType === 'audio') {
      const caption = window.prompt('Audio caption (optional):');
      editor.commands.setAudio({
        src: media.path,
        caption: caption || '',
      });
    }
    setShowMediaPicker(false);
  };

  const handleShopLinkSelect = (url: string, label: string) => {
    editor.chain().focus().setLink({ href: url }).insertContent(label).run();
    setShowShopLinkPicker(false);
  };

  // Handle block picker selection
  const handleBlockSelect = (blockId: string) => {
    setShowBlockPicker(false);

    switch (blockId) {
      case 'image':
        setMediaPickerType('image');
        setShowMediaPicker(true);
        break;
      case 'video':
        setMediaPickerType('video');
        setShowMediaPicker(true);
        break;
      case 'audio':
        setMediaPickerType('audio');
        setShowMediaPicker(true);
        break;
      case 'youtube':
        addYouTube();
        break;
      case 'divider':
        setActiveConfigModal('divider');
        break;
      case 'card':
        setActiveConfigModal('card');
        break;
      case 'accordion':
        setActiveConfigModal('accordion');
        break;
      case 'tabs':
        editor.commands.setTabs({
          tabs: [
            { title: 'Tab 1', content: 'Content for tab 1' },
            { title: 'Tab 2', content: 'Content for tab 2' },
          ],
        });
        break;
      case 'button':
        setActiveConfigModal('button');
        break;
      case 'cta':
        setActiveConfigModal('cta');
        break;
      case 'alert':
        setActiveConfigModal('alert');
        break;
      case 'progress':
        setActiveConfigModal('progress');
        break;
      case 'countdown':
        setActiveConfigModal('countdown');
        break;
      case 'social':
        setActiveConfigModal('social');
        break;
      case 'testimonial':
        setActiveConfigModal('testimonial');
        break;
      case 'toc':
        editor.commands.setTableOfContents({});
        break;
      case 'icon':
        editor.commands.setIconBlock({ icon: 'star', text: 'Featured', size: 'md' });
        break;
      default:
        break;
    }
  };

  // Dark mode toolbar button styling
  const toolbarBtnClass = (isActive: boolean) => `p-2 rounded-lg transition-all hover:bg-slate-600 ${isActive ? 'bg-blue-600/30 text-blue-400 ring-1 ring-blue-500/50' : 'text-slate-300 hover:text-white'}`;

  const dividerClass = 'w-px h-6 bg-slate-600/50 mx-1 self-center';

  return (
    <>
      <div className="border border-slate-600/50 rounded-xl overflow-hidden bg-slate-800/80 backdrop-blur">
        {/* Toolbar */}
        <div className="border-b border-slate-700/50 p-2 flex flex-wrap items-center gap-1 bg-slate-900/60">
          {/* Text Formatting */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={toolbarBtnClass(editor.isActive('bold'))}
            type="button"
            title="Bold"
          >
            <FiBold size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={toolbarBtnClass(editor.isActive('italic'))}
            type="button"
            title="Italic"
          >
            <FiItalic size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={toolbarBtnClass(editor.isActive('highlight'))}
            type="button"
            title="Highlight"
          >
            <span className="font-bold px-1 rounded bg-yellow-500/30 text-yellow-300">H</span>
          </button>

          <div className={dividerClass}></div>

          {/* Headings */}
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={toolbarBtnClass(editor.isActive('heading', { level: 2 }))}
            type="button"
            title="Heading 2"
          >
            <span className="font-bold text-sm">H2</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={toolbarBtnClass(editor.isActive('heading', { level: 3 }))}
            type="button"
            title="Heading 3"
          >
            <span className="font-bold text-sm">H3</span>
          </button>

          <div className={dividerClass}></div>

          {/* Alignment */}
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={toolbarBtnClass(editor.isActive({ textAlign: 'left' }))}
            type="button"
            title="Align Left"
          >
            <FiAlignLeft size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={toolbarBtnClass(editor.isActive({ textAlign: 'center' }))}
            type="button"
            title="Align Center"
          >
            <FiAlignCenter size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={toolbarBtnClass(editor.isActive({ textAlign: 'right' }))}
            type="button"
            title="Align Right"
          >
            <FiAlignRight size={18} />
          </button>

          <div className={dividerClass}></div>

          {/* Lists & Blocks */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={toolbarBtnClass(editor.isActive('bulletList'))}
            type="button"
            title="Bullet List"
          >
            <FiList size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={toolbarBtnClass(editor.isActive('blockquote'))}
            type="button"
            title="Quote"
          >
            <FiMessageSquare size={18} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={toolbarBtnClass(editor.isActive('codeBlock'))}
            type="button"
            title="Code Block"
          >
            <FiCode size={18} />
          </button>

          <div className={dividerClass}></div>

          {/* Links & Media */}
          <button
            onClick={addLink}
            className={toolbarBtnClass(editor.isActive('link'))}
            type="button"
            title="Add Link"
          >
            <FiLink size={18} />
          </button>
          <button
            onClick={() => {
              setMediaPickerType('image');
              setShowMediaPicker(true);
            }}
            className={toolbarBtnClass(false)}
            type="button"
            title="Add Image"
          >
            <FiImageIcon size={18} />
          </button>
          <button
            onClick={() => {
              setMediaPickerType('video');
              setShowMediaPicker(true);
            }}
            className={toolbarBtnClass(false)}
            type="button"
            title="Add Video"
          >
            <FiVideo size={18} />
          </button>
          <button
            onClick={() => {
              setMediaPickerType('audio');
              setShowMediaPicker(true);
            }}
            className={toolbarBtnClass(false)}
            type="button"
            title="Add Audio"
          >
            <FiMusic size={18} />
          </button>
          <button
            onClick={addYouTube}
            className={toolbarBtnClass(false)}
            type="button"
            title="Embed YouTube"
          >
            <FiYoutube size={18} />
          </button>
          <button
            onClick={addButton}
            className={toolbarBtnClass(false)}
            type="button"
            title="Add Button"
          >
            <FiSquare size={18} />
          </button>
          <button
            onClick={() => setShowShopLinkPicker(true)}
            className={toolbarBtnClass(false)}
            type="button"
            title="Add Shop Link"
          >
            <FiShoppingBag size={18} />
          </button>

          <div className={dividerClass}></div>

          {/* Block Picker */}
          <button
            onClick={() => setShowBlockPicker(true)}
            className="p-2 rounded-lg transition-all bg-gradient-to-r from-violet-600/30 to-purple-600/30 text-violet-400 hover:from-violet-600/50 hover:to-purple-600/50 ring-1 ring-violet-500/30"
            type="button"
            title="Insert Content Block"
          >
            <FiPlus size={18} />
          </button>

          <div className={dividerClass}></div>

          {/* Delete Selected Element */}
          <button
            onClick={() => {
              // Delete the current node (image, video, block, etc.)
              const { state } = editor;
              const { selection } = state;
              const node = state.doc.nodeAt(selection.from);

              if (node) {
                // Delete the node at current position
                editor.chain().focus().deleteSelection().run();
              } else {
                // Try to delete the parent node
                editor.chain().focus().deleteNode('imageWithCaption').run() ||
                editor.chain().focus().deleteNode('image').run() ||
                editor.chain().focus().deleteNode('video').run() ||
                editor.chain().focus().deleteNode('audio').run() ||
                editor.chain().focus().deleteNode('youtube').run() ||
                editor.chain().focus().deleteSelection().run();
              }
            }}
            className="p-2 rounded-lg transition-all bg-red-600/20 text-red-400 hover:bg-red-600/40 ring-1 ring-red-500/30"
            type="button"
            title="Delete Selected (click on image/block first, then click this)"
          >
            <FiTrash2 size={18} />
          </button>
        </div>

        {/* Editor Content */}
        <EditorContent
          editor={editor}
          className="bg-slate-900/50 min-h-[200px]"
        />
      </div>

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPickerModal
          type={mediaPickerType}
          onSelect={handleMediaSelect}
          onClose={() => setShowMediaPicker(false)}
        />
      )}

      {/* Shop Link Picker Modal */}
      {showShopLinkPicker && (
        <ShopLinkPickerModal
          onSelect={handleShopLinkSelect}
          onClose={() => setShowShopLinkPicker(false)}
        />
      )}

      {/* Content Block Picker Modal */}
      {showBlockPicker && (
        <ContentBlockPicker
          onSelect={handleBlockSelect}
          onClose={() => setShowBlockPicker(false)}
        />
      )}

      {/* Block Configuration Modals */}
      {activeConfigModal === 'alert' && (
        <AlertConfigModal
          onInsert={(data) => {
            editor.commands.setAlert(data);
            setActiveConfigModal(null);
          }}
          onClose={() => setActiveConfigModal(null)}
        />
      )}
      {activeConfigModal === 'button' && (
        <ButtonConfigModal
          onInsert={(data) => {
            editor.commands.setButton(data);
            setActiveConfigModal(null);
          }}
          onClose={() => setActiveConfigModal(null)}
        />
      )}
      {activeConfigModal === 'divider' && (
        <DividerConfigModal
          onInsert={(data) => {
            editor.commands.setDivider(data);
            setActiveConfigModal(null);
          }}
          onClose={() => setActiveConfigModal(null)}
        />
      )}
      {activeConfigModal === 'cta' && (
        <CTAConfigModal
          onInsert={(data) => {
            editor.commands.setCTA(data as any);
            setActiveConfigModal(null);
          }}
          onClose={() => setActiveConfigModal(null)}
        />
      )}
      {activeConfigModal === 'social' && (
        <SocialConfigModal
          onInsert={(data) => {
            editor.commands.setSocialEmbed(data);
            setActiveConfigModal(null);
          }}
          onClose={() => setActiveConfigModal(null)}
        />
      )}
      {activeConfigModal === 'card' && (
        <CardConfigModal
          onInsert={(data) => {
            editor.commands.setCard(data as any);
            setActiveConfigModal(null);
          }}
          onClose={() => setActiveConfigModal(null)}
        />
      )}
      {activeConfigModal === 'testimonial' && (
        <TestimonialConfigModal
          onInsert={(data) => {
            editor.commands.setTestimonial(data as any);
            setActiveConfigModal(null);
          }}
          onClose={() => setActiveConfigModal(null)}
        />
      )}
      {activeConfigModal === 'accordion' && (
        <AccordionConfigModal
          onInsert={(data) => {
            editor.commands.setAccordion(data as any);
            setActiveConfigModal(null);
          }}
          onClose={() => setActiveConfigModal(null)}
        />
      )}
      {activeConfigModal === 'progress' && (
        <ProgressConfigModal
          onInsert={(data) => {
            editor.commands.setProgressBar(data as any);
            setActiveConfigModal(null);
          }}
          onClose={() => setActiveConfigModal(null)}
        />
      )}
      {activeConfigModal === 'countdown' && (
        <CountdownConfigModal
          onInsert={(data) => {
            editor.commands.setCountdown(data as any);
            setActiveConfigModal(null);
          }}
          onClose={() => setActiveConfigModal(null)}
        />
      )}
    </>
  );
}

