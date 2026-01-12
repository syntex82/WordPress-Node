/**
 * Inline WYSIWYG Editor for Theme Customizer
 * Compact TipTap-based rich text editor for text fields
 * Supports: bold, italic, underline, headings, lists, links, colors
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useState, useCallback, useRef } from 'react';
import {
  FiBold, FiItalic, FiUnderline, FiLink, FiList,
  FiX, FiCheck, FiDroplet
} from 'react-icons/fi';

interface InlineWysiwygEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  variant?: 'compact' | 'full';
  allowHtml?: boolean;
  label?: string;
}

export default function InlineWysiwygEditor({
  value,
  onChange,
  placeholder = 'Enter text...',
  className = '',
  minHeight = '80px',
  variant = 'compact',
  allowHtml = true,
  label,
}: InlineWysiwygEditorProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: variant === 'full' ? { levels: [1, 2, 3, 4] } : false,
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextStyle,
      Color,
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(allowHtml ? html : editor.getText());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm prose-invert focus:outline-none w-full',
        style: `min-height: ${minHeight}`,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const addLink = useCallback(() => {
    if (linkUrl && editor) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setShowLinkInput(false);
      setLinkUrl('');
    }
  }, [editor, linkUrl]);

  const removeLink = useCallback(() => {
    editor?.chain().focus().unsetLink().run();
  }, [editor]);

  const colors = ['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
  const [isFocused, setIsFocused] = useState(false);

  if (!editor) return null;

  const buttonClass = (active: boolean) =>
    `p-1.5 rounded transition-colors ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`;

  return (
    <div className={`relative ${className}`}>
      {label && <label className="block text-sm text-gray-300 mb-1.5">{label}</label>}

      {/* Floating Toolbar - appears when focused */}
      {isFocused && (
        <div className="absolute -top-10 left-0 z-20 flex items-center gap-0.5 p-1 bg-gray-800 rounded-lg shadow-xl border border-gray-700">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive('bold'))} title="Bold">
            <FiBold size={14} />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive('italic'))} title="Italic">
            <FiItalic size={14} />
          </button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={buttonClass(editor.isActive('underline'))} title="Underline">
            <FiUnderline size={14} />
          </button>
          <div className="w-px h-4 bg-gray-600 mx-1" />
          <button type="button" onClick={() => setShowLinkInput(!showLinkInput)} className={buttonClass(editor.isActive('link'))} title="Link">
            <FiLink size={14} />
          </button>
          <div className="relative">
            <button type="button" onClick={() => setShowColorPicker(!showColorPicker)} className={buttonClass(false)} title="Color">
              <FiDroplet size={14} />
            </button>
            {showColorPicker && (
              <div className="absolute top-full left-0 mt-1 p-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 flex gap-1 z-10">
                {colors.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => { editor.chain().focus().setColor(color).run(); setShowColorPicker(false); }}
                    className="w-5 h-5 rounded-full border border-gray-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Link Input Popup */}
      {showLinkInput && (
        <div className="absolute top-0 left-0 right-0 z-20 p-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 flex gap-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL..."
            className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-white"
            onKeyDown={(e) => e.key === 'Enter' && addLink()}
            autoFocus
          />
          <button type="button" onClick={addLink} className="p-1.5 bg-green-600 rounded text-white hover:bg-green-500"><FiCheck size={14} /></button>
          <button type="button" onClick={removeLink} className="p-1.5 bg-red-600 rounded text-white hover:bg-red-500"><FiX size={14} /></button>
        </div>
      )}

      {/* Editor Content */}
      <div
        className="bg-gray-700 border border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          // Only blur if focus is leaving the entire editor container
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setTimeout(() => setIsFocused(false), 200);
          }
        }}
      >
        {variant === 'full' && (
          <div className="flex items-center gap-0.5 p-1.5 border-b border-gray-600 bg-gray-800/50">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive('bold'))}><FiBold size={14} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive('italic'))}><FiItalic size={14} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={buttonClass(editor.isActive('underline'))}><FiUnderline size={14} /></button>
            <div className="w-px h-4 bg-gray-600 mx-1" />
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive('bulletList'))}><FiList size={14} /></button>
          </div>
        )}
        <EditorContent editor={editor} className="px-3 py-2" />
      </div>
    </div>
  );
}

