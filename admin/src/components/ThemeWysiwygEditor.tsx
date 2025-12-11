/**
 * Theme WYSIWYG Editor Component
 * Interactive visual editor for theme preview with media support
 */

import { useState, useRef, useCallback } from 'react';
import { FiImage, FiVideo, FiMusic, FiTrash2, FiMove, FiPlus, FiEdit2, FiAlignLeft, FiAlignCenter, FiAlignRight, FiShoppingBag } from 'react-icons/fi';
import WysiwygAudioPlayer from './WysiwygAudioPlayer';
import MediaPickerModal from './MediaPickerModal';
import ShopLinkPickerModal from './ShopLinkPickerModal';
import { ThemeDesignConfig } from '../services/api';

interface MediaBlock {
  id: string;
  type: 'image' | 'video' | 'audio' | 'text' | 'shoplink';
  src?: string;
  content?: string;
  title?: string;
  artist?: string;
  coverImage?: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
  url?: string;
  label?: string;
}

interface ThemeWysiwygEditorProps {
  config: ThemeDesignConfig;
  onMediaChange?: (media: MediaBlock[]) => void;
}

export default function ThemeWysiwygEditor({ config, onMediaChange }: ThemeWysiwygEditorProps) {
  const [mediaBlocks, setMediaBlocks] = useState<MediaBlock[]>([
    { id: 'welcome', type: 'text', content: 'Welcome to Your New Theme', align: 'left' },
  ]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaPickerType, setMediaPickerType] = useState<'image' | 'video' | 'audio'>('image');
  const [showShopLinkPicker, setShowShopLinkPicker] = useState(false);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const { colors, typography, spacing, borders } = config;

  // Generate unique ID
  const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Add media block
  const addMediaBlock = (type: 'image' | 'video' | 'audio') => {
    setMediaPickerType(type);
    setShowMediaPicker(true);
  };

  // Handle media selection from picker
  const handleMediaSelect = (media: any) => {
    const newBlock: MediaBlock = {
      id: generateId(),
      type: mediaPickerType,
      src: media.path,
      align: 'center',
      width: 100,
    };

    if (mediaPickerType === 'audio') {
      newBlock.title = media.originalName?.replace(/\.[^/.]+$/, '') || 'Audio Track';
      newBlock.artist = 'Unknown Artist';
    }

    setMediaBlocks(prev => {
      const updated = [...prev, newBlock];
      onMediaChange?.(updated);
      return updated;
    });
    setShowMediaPicker(false);
  };

  // Add text block
  const addTextBlock = () => {
    const newBlock: MediaBlock = {
      id: generateId(),
      type: 'text',
      content: 'Click to edit this text...',
      align: 'left',
    };
    setMediaBlocks(prev => {
      const updated = [...prev, newBlock];
      onMediaChange?.(updated);
      return updated;
    });
  };

  // Add shop link block
  const handleShopLinkSelect = (url: string, label: string) => {
    const newBlock: MediaBlock = {
      id: generateId(),
      type: 'shoplink',
      url,
      label,
      align: 'center',
    };
    setMediaBlocks(prev => {
      const updated = [...prev, newBlock];
      onMediaChange?.(updated);
      return updated;
    });
    setShowShopLinkPicker(false);
  };

  // Update block
  const updateBlock = (id: string, updates: Partial<MediaBlock>) => {
    setMediaBlocks(prev => {
      const updated = prev.map(b => b.id === id ? { ...b, ...updates } : b);
      onMediaChange?.(updated);
      return updated;
    });
  };

  // Delete block
  const deleteBlock = (id: string) => {
    setMediaBlocks(prev => {
      const updated = prev.filter(b => b.id !== id);
      onMediaChange?.(updated);
      return updated;
    });
  };

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, blockId: string) => {
    setDraggedBlock(blockId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedBlock || draggedBlock === targetId) return;

    setMediaBlocks(prev => {
      const draggedIndex = prev.findIndex(b => b.id === draggedBlock);
      const targetIndex = prev.findIndex(b => b.id === targetId);
      const newBlocks = [...prev];
      const [removed] = newBlocks.splice(draggedIndex, 1);
      newBlocks.splice(targetIndex, 0, removed);
      onMediaChange?.(newBlocks);
      return newBlocks;
    });
    setDraggedBlock(null);
  }, [draggedBlock, onMediaChange]);

  // Handle file drop
  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length === 0) return;
    // For now, just show picker - actual upload would need API integration
    const file = files[0];
    if (file.type.startsWith('image/')) addMediaBlock('image');
    else if (file.type.startsWith('video/')) addMediaBlock('video');
    else if (file.type.startsWith('audio/')) addMediaBlock('audio');
  }, []);

  const themeColors = {
    primary: colors.primary,
    background: colors.background,
    surface: colors.surface,
    text: colors.text,
    textMuted: colors.textMuted,
  };

  return (
    <div
      ref={dropZoneRef}
      onDragOver={handleDragOver}
      onDrop={handleFileDrop}
      style={{
        background: colors.background,
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${colors.border}`,
        minHeight: 500,
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          padding: '12px 16px',
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => addMediaBlock('image')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: borders.radius,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          <FiImage size={16} /> Add Image
        </button>
        <button
          onClick={() => addMediaBlock('video')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: borders.radius,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          <FiVideo size={16} /> Add Video
        </button>
        <button
          onClick={() => addMediaBlock('audio')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: '#ec4899',
            color: 'white',
            border: 'none',
            borderRadius: borders.radius,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          <FiMusic size={16} /> Add Audio
        </button>
        <button
          onClick={addTextBlock}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: colors.text,
            color: colors.background,
            border: 'none',
            borderRadius: borders.radius,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          <FiPlus size={16} /> Add Text
        </button>
        <button
          onClick={() => setShowShopLinkPicker(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: borders.radius,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          <FiShoppingBag size={16} /> Add Shop Link
        </button>
      </div>

      {/* Content Area */}
      <div style={{ padding: spacing.containerPadding }}>
        {mediaBlocks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 60,
              color: colors.textMuted,
              border: `2px dashed ${colors.border}`,
              borderRadius: borders.radius,
            }}
          >
            <p style={{ fontSize: 18, marginBottom: 8 }}>Drag & drop media here</p>
            <p style={{ fontSize: 14 }}>Or use the buttons above to add content</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.elementSpacing }}>
            {mediaBlocks.map((block) => (
              <div
                key={block.id}
                draggable
                onDragStart={(e) => handleDragStart(e, block.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, block.id)}
                style={{
                  position: 'relative',
                  background: colors.surface,
                  border: `${borders.width}px solid ${colors.border}`,
                  borderRadius: borders.radius,
                  padding: 16,
                  opacity: draggedBlock === block.id ? 0.5 : 1,
                  cursor: 'grab',
                }}
              >
                {/* Block Controls */}
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    display: 'flex',
                    gap: 4,
                    background: 'rgba(0,0,0,0.7)',
                    borderRadius: 6,
                    padding: 4,
                    zIndex: 10,
                  }}
                >
                  <button
                    onClick={() => updateBlock(block.id, { align: 'left' })}
                    style={{ padding: 4, background: block.align === 'left' ? colors.primary : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    <FiAlignLeft size={14} color="white" />
                  </button>
                  <button
                    onClick={() => updateBlock(block.id, { align: 'center' })}
                    style={{ padding: 4, background: block.align === 'center' ? colors.primary : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    <FiAlignCenter size={14} color="white" />
                  </button>
                  <button
                    onClick={() => updateBlock(block.id, { align: 'right' })}
                    style={{ padding: 4, background: block.align === 'right' ? colors.primary : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                  >
                    <FiAlignRight size={14} color="white" />
                  </button>
                  <div style={{ width: 1, background: 'rgba(255,255,255,0.3)', margin: '0 4px' }} />
                  <button style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'grab' }}>
                    <FiMove size={14} color="white" />
                  </button>
                  <button
                    onClick={() => deleteBlock(block.id)}
                    style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
                    <FiTrash2 size={14} color="#ef4444" />
                  </button>
                </div>

                {/* Block Content */}
                <div style={{ textAlign: block.align }}>
                  {block.type === 'text' && (
                    editingBlock === block.id ? (
                      <textarea
                        autoFocus
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        onBlur={() => setEditingBlock(null)}
                        style={{
                          width: '100%',
                          minHeight: 80,
                          padding: 12,
                          border: `2px solid ${colors.primary}`,
                          borderRadius: borders.radius,
                          fontSize: typography.baseFontSize,
                          fontFamily: typography.bodyFont,
                          lineHeight: typography.lineHeight,
                          color: colors.text,
                          background: colors.background,
                          resize: 'vertical',
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => setEditingBlock(block.id)}
                        style={{
                          padding: 12,
                          fontSize: typography.baseFontSize,
                          fontFamily: typography.bodyFont,
                          lineHeight: typography.lineHeight,
                          color: colors.text,
                          cursor: 'text',
                          minHeight: 40,
                        }}
                      >
                        {block.content}
                        <FiEdit2 size={14} style={{ marginLeft: 8, opacity: 0.5 }} />
                      </div>
                    )
                  )}
                  {block.type === 'image' && block.src && (
                    <div style={{ display: 'inline-block', maxWidth: `${block.width || 100}%` }}>
                      <img
                        src={block.src}
                        alt=""
                        style={{
                          width: '100%',
                          borderRadius: borders.radius,
                          display: 'block',
                        }}
                      />
                      <input
                        type="range"
                        min={20}
                        max={100}
                        value={block.width || 100}
                        onChange={(e) => updateBlock(block.id, { width: Number(e.target.value) })}
                        style={{ width: '100%', marginTop: 8 }}
                      />
                    </div>
                  )}
                  {block.type === 'video' && block.src && (
                    <div style={{ display: 'inline-block', maxWidth: `${block.width || 100}%` }}>
                      <video
                        src={block.src}
                        controls
                        style={{
                          width: '100%',
                          borderRadius: borders.radius,
                          display: 'block',
                        }}
                      />
                      <input
                        type="range"
                        min={20}
                        max={100}
                        value={block.width || 100}
                        onChange={(e) => updateBlock(block.id, { width: Number(e.target.value) })}
                        style={{ width: '100%', marginTop: 8 }}
                      />
                    </div>
                  )}
                  {block.type === 'audio' && block.src && (
                    <div style={{ display: 'inline-block' }}>
                      <WysiwygAudioPlayer
                        src={block.src}
                        title={block.title}
                        artist={block.artist}
                        coverImage={block.coverImage}
                        themeColors={themeColors}
                      />
                    </div>
                  )}
                  {block.type === 'shoplink' && block.url && (
                    <div style={{ display: 'inline-block' }}>
                      <a
                        href={block.url}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '12px 24px',
                          background: colors.primary,
                          color: 'white',
                          borderRadius: borders.radius,
                          textDecoration: 'none',
                          fontSize: typography.baseFontSize,
                          fontFamily: typography.bodyFont,
                          fontWeight: 600,
                        }}
                        onClick={(e) => e.preventDefault()}
                      >
                        <FiShoppingBag size={18} />
                        {block.label || 'Shop'}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
    </div>
  );
}

// Export MediaBlock type for use in other components
export type { MediaBlock };
