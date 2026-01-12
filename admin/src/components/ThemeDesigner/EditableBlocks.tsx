/**
 * Editable Block Components for Theme Designer
 * These are enhanced versions of content blocks with inline editing capabilities
 * Each block wraps the original display component and adds editable overlays
 */
import React, { useState, lazy, Suspense } from 'react';
import { FiEdit2, FiImage, FiSettings, FiPlay, FiPause, FiVolume2, FiVolumeX, FiMaximize } from 'react-icons/fi';
import { CustomThemeSettings } from '../../services/api';
import MediaPickerModal from '../MediaPickerModal';

// Import inline editing components
import {
  EditableText,
  EditableImage,
  EditableVideo,
  EditableAudio,
  EditableGallery,
  BlockEditWrapper,
  InlineColorPicker,
  InlineNumberSlider,
  InlineSelect,
  InlineToggle,
} from './InlineEditSystem';

// Lazy load RichTextEditor for performance
const RichTextEditor = lazy(() => import('../RichTextEditor'));

// ============ Types ============
interface EditableBlockProps {
  block: {
    id: string;
    type: string;
    props: Record<string, any>;
  };
  settings: CustomThemeSettings;
  onUpdate: (props: Record<string, any>) => void;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  editMode?: 'inline' | 'sidebar' | 'modal';
}

// ============ Mini Rich Text Editor for Inline Editing ============
function MiniRichTextEditor({
  value,
  onChange,
  placeholder = 'Click to edit...',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
        className={`cursor-text hover:bg-blue-500/10 hover:outline hover:outline-2 hover:outline-dashed hover:outline-blue-400 rounded transition-all ${className} ${!value ? 'text-gray-500 italic' : ''}`}
        dangerouslySetInnerHTML={{ __html: value || placeholder }}
      />
    );
  }

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <Suspense fallback={<div className="p-4 bg-gray-800 rounded animate-pulse">Loading editor...</div>}>
        <div className="min-h-[100px]">
          <RichTextEditor
            content={value}
            onChange={onChange}
          />
        </div>
      </Suspense>
      <button
        onClick={() => setIsEditing(false)}
        className="absolute -top-8 right-0 px-3 py-1 bg-green-500 hover:bg-green-600 rounded text-white text-sm"
      >
        Done
      </button>
    </div>
  );
}

// ============ Editable Hero Block ============
export function EditableHeroBlock({
  block,
  settings,
  onUpdate,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: EditableBlockProps) {
  const { props } = block;
  const [showSettings, setShowSettings] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showVideoPicker, setShowVideoPicker] = useState(false);

  const updateProp = (key: string, value: any) => {
    onUpdate({ ...props, [key]: value });
  };

  const {
    title = 'Your Amazing Headline',
    subtitle = 'Add your compelling subtitle here',
    ctaText = 'Get Started',
    ctaUrl = '#',
    secondaryCtaText,
    secondaryCtaUrl,
    backgroundImage,
    backgroundVideo,
    overlay = 0.4,
    alignment = 'center',
  } = props;

  const alignmentClasses = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  };

  return (
    <BlockEditWrapper
      block={block}
      onUpdate={onUpdate}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <div
        className="relative min-h-[400px] flex items-center justify-center overflow-hidden"
        style={{ borderRadius: settings.borders.radius }}
      >
        {/* Background */}
        {backgroundVideo ? (
          <video
            src={backgroundVideo}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : backgroundImage ? (
          <img
            src={backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${settings.colors.primary}, ${settings.colors.secondary})`,
            }}
          />
        )}

        {/* Overlay */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `rgba(0,0,0,${overlay})` }}
        />

        {/* Content - Editable */}
        <div className={`relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col ${alignmentClasses[alignment as keyof typeof alignmentClasses]}`}>
          {/* Editable Title */}
          <EditableText
            value={title}
            onChange={(val) => updateProp('title', val)}
            placeholder="Enter headline..."
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            style={{ fontFamily: settings.typography.headingFont }}
            tag="h1"
          />

          {/* Editable Subtitle */}
          <EditableText
            value={subtitle}
            onChange={(val) => updateProp('subtitle', val)}
            placeholder="Enter subtitle..."
            className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl"
            style={{ fontFamily: settings.typography.bodyFont }}
            tag="p"
            multiline
          />

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <div className="relative group">
              <EditableText
                value={ctaText}
                onChange={(val) => updateProp('ctaText', val)}
                placeholder="Button text..."
                className="px-8 py-4 rounded-lg font-semibold text-white inline-block"
                style={{
                  backgroundColor: settings.colors.primary,
                  borderRadius: settings.borders.radius,
                }}
              />
            </div>
            {secondaryCtaText && (
              <div className="relative group">
                <EditableText
                  value={secondaryCtaText}
                  onChange={(val) => updateProp('secondaryCtaText', val)}
                  placeholder="Secondary button..."
                  className="px-8 py-4 rounded-lg font-semibold text-white inline-block border-2 border-white/30"
                  style={{ borderRadius: settings.borders.radius }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Media Controls Overlay */}
        {isSelected && (
          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowImagePicker(true);
              }}
              className="px-3 py-2 bg-gray-900/80 hover:bg-gray-800 rounded-lg text-white text-sm flex items-center gap-2"
            >
              <FiImage size={16} />
              {backgroundImage ? 'Change Image' : 'Add Background'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowVideoPicker(true);
              }}
              className="px-3 py-2 bg-gray-900/80 hover:bg-gray-800 rounded-lg text-white text-sm flex items-center gap-2"
            >
              <FiPlay size={16} />
              {backgroundVideo ? 'Change Video' : 'Add Video'}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(true);
              }}
              className="p-2 bg-gray-900/80 hover:bg-gray-800 rounded-lg text-white"
            >
              <FiSettings size={16} />
            </button>
          </div>
        )}

        {/* Quick Settings Popup */}
        {showSettings && (
          <div
            className="absolute bottom-16 left-4 p-4 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 z-50 w-72"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-semibold text-white">Hero Settings</h4>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <InlineNumberSlider
                label="Overlay Opacity"
                value={overlay * 100}
                onChange={(val) => updateProp('overlay', val / 100)}
                min={0}
                max={100}
                suffix="%"
              />

              <InlineSelect
                label="Alignment"
                value={alignment}
                onChange={(val) => updateProp('alignment', val)}
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Center' },
                  { value: 'right', label: 'Right' },
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Media Pickers */}
      {showImagePicker && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => {
            updateProp('backgroundImage', media.path || media.url);
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
      {showVideoPicker && (
        <MediaPickerModal
          type="video"
          onSelect={(media) => {
            updateProp('backgroundVideo', media.path || media.url);
            setShowVideoPicker(false);
          }}
          onClose={() => setShowVideoPicker(false)}
        />
      )}
    </BlockEditWrapper>
  );
}

// ============ Editable Testimonial Block ============
export function EditableTestimonialBlock({
  block,
  settings,
  onUpdate,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: EditableBlockProps) {
  const { props } = block;
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const updateProp = (key: string, value: any) => {
    onUpdate({ ...props, [key]: value });
  };

  const {
    quote = 'This is an amazing testimonial quote that speaks to the quality of your product or service.',
    author = 'John Doe',
    role = 'CEO',
    company = 'Acme Inc.',
    avatar,
    rating = 5,
  } = props;

  return (
    <BlockEditWrapper
      block={block}
      onUpdate={onUpdate}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <div
        className="p-8 rounded-xl"
        style={{
          backgroundColor: settings.colors.surface,
          borderRadius: settings.borders.radius * 1.5,
        }}
      >
        {/* Rating Stars */}
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={(e) => {
                e.stopPropagation();
                updateProp('rating', star);
              }}
              className={`text-xl transition-colors ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Editable Quote */}
        <MiniRichTextEditor
          value={quote}
          onChange={(val) => updateProp('quote', val)}
          placeholder="Enter testimonial quote..."
          className="text-lg italic mb-6"
        />

        {/* Author Info */}
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-14 h-14 rounded-full bg-gray-700 overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500"
            onClick={(e) => {
              e.stopPropagation();
              setShowAvatarPicker(true);
            }}
          >
            {avatar ? (
              <img src={avatar} alt={author} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl text-gray-500">
                {author.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div>
            <EditableText
              value={author}
              onChange={(val) => updateProp('author', val)}
              placeholder="Author name..."
              className="font-semibold text-white"
              style={{ color: settings.colors.heading }}
            />
            <div className="flex items-center gap-2">
              <EditableText
                value={role}
                onChange={(val) => updateProp('role', val)}
                placeholder="Role..."
                className="text-sm"
                style={{ color: settings.colors.textMuted }}
              />
              <span style={{ color: settings.colors.textMuted }}>at</span>
              <EditableText
                value={company}
                onChange={(val) => updateProp('company', val)}
                placeholder="Company..."
                className="text-sm"
                style={{ color: settings.colors.textMuted }}
              />
            </div>
          </div>
        </div>
      </div>

      {showAvatarPicker && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => {
            updateProp('avatar', media.path || media.url);
            setShowAvatarPicker(false);
          }}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}
    </BlockEditWrapper>
  );
}

// ============ Editable Features Block ============
export function EditableFeaturesBlock({
  block,
  settings,
  onUpdate,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: EditableBlockProps) {
  const { props } = block;
  const [editingFeatureIndex, setEditingFeatureIndex] = useState<number | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const updateProp = (key: string, value: any) => {
    onUpdate({ ...props, [key]: value });
  };

  const {
    title = 'Our Features',
    subtitle = 'Everything you need to succeed',
    features = [
      { icon: '🚀', title: 'Fast Performance', description: 'Lightning-fast loading times' },
      { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' },
      { icon: '📱', title: 'Responsive', description: 'Works on all devices' },
    ],
    columns = 3,
  } = props;

  const updateFeature = (index: number, key: string, value: any) => {
    const newFeatures = [...features];
    newFeatures[index] = { ...newFeatures[index], [key]: value };
    updateProp('features', newFeatures);
  };

  const addFeature = () => {
    updateProp('features', [...features, { icon: '✨', title: 'New Feature', description: 'Feature description' }]);
  };

  const removeFeature = (index: number) => {
    updateProp('features', features.filter((_: any, i: number) => i !== index));
  };

  return (
    <BlockEditWrapper
      block={block}
      onUpdate={onUpdate}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <div className="py-12 px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <EditableText
            value={title}
            onChange={(val) => updateProp('title', val)}
            placeholder="Section title..."
            className="text-3xl font-bold mb-4"
            style={{ color: settings.colors.heading, fontFamily: settings.typography.headingFont }}
            tag="h2"
          />
          <EditableText
            value={subtitle}
            onChange={(val) => updateProp('subtitle', val)}
            placeholder="Section subtitle..."
            className="text-lg max-w-2xl mx-auto"
            style={{ color: settings.colors.textMuted }}
            tag="p"
          />
        </div>

        {/* Features Grid */}
        <div
          className="grid gap-8"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {features.map((feature: any, index: number) => (
            <div
              key={index}
              className="relative group p-6 rounded-xl transition-all hover:shadow-lg"
              style={{
                backgroundColor: settings.colors.surface,
                borderRadius: settings.borders.radius,
              }}
            >
              {/* Feature Icon */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4 cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: `${settings.colors.primary}20` }}
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFeatureIndex(index);
                  setShowIconPicker(true);
                }}
              >
                {feature.icon}
              </div>

              {/* Feature Title */}
              <EditableText
                value={feature.title}
                onChange={(val) => updateFeature(index, 'title', val)}
                placeholder="Feature title..."
                className="text-xl font-semibold mb-2"
                style={{ color: settings.colors.heading }}
                tag="h3"
              />

              {/* Feature Description */}
              <EditableText
                value={feature.description}
                onChange={(val) => updateFeature(index, 'description', val)}
                placeholder="Feature description..."
                className="text-base"
                style={{ color: settings.colors.textMuted }}
                multiline
              />

              {/* Delete button */}
              {isSelected && features.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFeature(index);
                  }}
                  className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* Add Feature Button */}
          {isSelected && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                addFeature();
              }}
              className="p-6 rounded-xl border-2 border-dashed border-gray-600 hover:border-blue-500 flex flex-col items-center justify-center gap-2 transition-colors"
              style={{ borderRadius: settings.borders.radius }}
            >
              <span className="text-3xl">+</span>
              <span className="text-sm text-gray-400">Add Feature</span>
            </button>
          )}
        </div>

        {/* Column Selector */}
        {isSelected && (
          <div className="mt-6 flex justify-center gap-2">
            {[2, 3, 4].map((col) => (
              <button
                key={col}
                onClick={(e) => {
                  e.stopPropagation();
                  updateProp('columns', col);
                }}
                className={`px-3 py-1.5 rounded text-sm ${
                  columns === col ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
                }`}
              >
                {col} Columns
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Emoji Icon Picker */}
      {showIconPicker && editingFeatureIndex !== null && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowIconPicker(false)}
        >
          <div
            className="bg-gray-900 rounded-xl p-4 max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-lg font-semibold text-white mb-4">Choose Icon</h4>
            <div className="grid grid-cols-8 gap-2">
              {['🚀', '⚡', '🔒', '💡', '🎯', '📱', '💪', '🌟', '✨', '🔥', '💎', '🎨', '📊', '🔧', '💬', '❤️'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    updateFeature(editingFeatureIndex, 'icon', emoji);
                    setShowIconPicker(false);
                  }}
                  className="w-10 h-10 text-2xl hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </BlockEditWrapper>
  );
}

// ============ Editable CTA Block ============
export function EditableCTABlock({
  block,
  settings,
  onUpdate,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: EditableBlockProps) {
  const { props } = block;
  const [showSettings, setShowSettings] = useState(false);

  const updateProp = (key: string, value: any) => {
    onUpdate({ ...props, [key]: value });
  };

  const {
    heading = 'Ready to Get Started?',
    description = 'Join thousands of satisfied customers today.',
    buttonText = 'Start Now',
    buttonUrl = '#',
    backgroundType = 'gradient',
    backgroundColor,
  } = props;

  const bgStyle = backgroundType === 'gradient'
    ? `linear-gradient(135deg, ${settings.colors.primary}, ${settings.colors.secondary})`
    : backgroundColor || settings.colors.primary;

  return (
    <BlockEditWrapper
      block={block}
      onUpdate={onUpdate}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <div
        className="py-16 px-8 text-center"
        style={{
          background: bgStyle,
          borderRadius: settings.borders.radius * 1.5,
        }}
      >
        <EditableText
          value={heading}
          onChange={(val) => updateProp('heading', val)}
          placeholder="CTA heading..."
          className="text-3xl md:text-4xl font-bold text-white mb-4"
          style={{ fontFamily: settings.typography.headingFont }}
          tag="h2"
        />

        <EditableText
          value={description}
          onChange={(val) => updateProp('description', val)}
          placeholder="CTA description..."
          className="text-xl text-white/90 mb-8 max-w-2xl mx-auto"
          tag="p"
        />

        <EditableText
          value={buttonText}
          onChange={(val) => updateProp('buttonText', val)}
          placeholder="Button text..."
          className="inline-block px-8 py-4 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          style={{ borderRadius: settings.borders.radius }}
        />

        {/* Settings Button */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowSettings(!showSettings);
            }}
            className="absolute bottom-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg text-white"
          >
            <FiSettings size={16} />
          </button>
        )}

        {/* Quick Settings */}
        {showSettings && (
          <div
            className="absolute bottom-14 right-4 p-4 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 z-50 w-64 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <InlineSelect
              label="Background Type"
              value={backgroundType}
              onChange={(val) => updateProp('backgroundType', val)}
              options={[
                { value: 'gradient', label: 'Gradient' },
                { value: 'solid', label: 'Solid Color' },
              ]}
            />
            {backgroundType === 'solid' && (
              <div className="mt-3">
                <InlineColorPicker
                  label="Background Color"
                  value={backgroundColor || settings.colors.primary}
                  onChange={(val) => updateProp('backgroundColor', val)}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </BlockEditWrapper>
  );
}

// ============ Editable Gallery Block ============
export function EditableGalleryBlock({
  block,
  settings,
  onUpdate,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: EditableBlockProps) {
  const { props } = block;

  const updateProp = (key: string, value: any) => {
    onUpdate({ ...props, [key]: value });
  };

  const {
    images = [],
    columns = 3,
    layout = 'grid',
    gap = 16,
  } = props;

  return (
    <BlockEditWrapper
      block={block}
      onUpdate={onUpdate}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <div className="py-6">
        <EditableGallery
          images={images}
          onChange={(newImages) => updateProp('images', newImages)}
          columns={columns}
        />

        {/* Layout Options */}
        {isSelected && (
          <div className="mt-4 flex justify-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Columns:</span>
              {[2, 3, 4, 5].map((col) => (
                <button
                  key={col}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateProp('columns', col);
                  }}
                  className={`w-8 h-8 rounded text-sm ${
                    columns === col ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </BlockEditWrapper>
  );
}

// ============ Editable Video Block ============
export function EditableVideoBlock({
  block,
  settings,
  onUpdate,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: EditableBlockProps) {
  const { props } = block;
  const [showSettings, setShowSettings] = useState(false);

  const updateProp = (key: string, value: any) => {
    onUpdate({ ...props, [key]: value });
  };

  const {
    videoUrl = '',
    posterUrl = '',
    title = '',
    autoplay = false,
    muted = true,
    loop = true,
    controls = true,
    aspectRatio = '16/9',
  } = props;

  return (
    <BlockEditWrapper
      block={block}
      onUpdate={onUpdate}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <div className="relative" style={{ borderRadius: settings.borders.radius }}>
        <EditableVideo
          src={videoUrl}
          posterUrl={posterUrl}
          onChange={(url) => updateProp('videoUrl', url)}
          onPosterChange={(url) => updateProp('posterUrl', url)}
          autoplay={autoplay}
          muted={muted}
          loop={loop}
          controls={controls}
          style={{ aspectRatio, borderRadius: settings.borders.radius }}
        />

        {/* Title */}
        {(title || isSelected) && (
          <div className="mt-3">
            <EditableText
              value={title}
              onChange={(val) => updateProp('title', val)}
              placeholder="Video title (optional)..."
              className="text-lg font-medium"
              style={{ color: settings.colors.heading }}
            />
          </div>
        )}

        {/* Settings */}
        {isSelected && (
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(!showSettings);
              }}
              className="p-2 bg-gray-900/80 hover:bg-gray-800 rounded-lg text-white"
            >
              <FiSettings size={16} />
            </button>
          </div>
        )}

        {showSettings && (
          <div
            className="absolute top-12 right-2 p-4 bg-gray-900 rounded-xl shadow-2xl border border-gray-700 z-50 w-56"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="text-sm font-semibold text-white mb-3">Video Settings</h4>
            <div className="space-y-3">
              <InlineToggle
                label="Autoplay"
                value={autoplay}
                onChange={(val) => updateProp('autoplay', val)}
              />
              <InlineToggle
                label="Muted"
                value={muted}
                onChange={(val) => updateProp('muted', val)}
              />
              <InlineToggle
                label="Loop"
                value={loop}
                onChange={(val) => updateProp('loop', val)}
              />
              <InlineToggle
                label="Show Controls"
                value={controls}
                onChange={(val) => updateProp('controls', val)}
              />
              <InlineSelect
                label="Aspect Ratio"
                value={aspectRatio}
                onChange={(val) => updateProp('aspectRatio', val)}
                options={[
                  { value: '16/9', label: '16:9 (Widescreen)' },
                  { value: '4/3', label: '4:3 (Standard)' },
                  { value: '1/1', label: '1:1 (Square)' },
                  { value: '9/16', label: '9:16 (Portrait)' },
                ]}
              />
            </div>
          </div>
        )}
      </div>
    </BlockEditWrapper>
  );
}

// ============ Editable Audio Block ============
export function EditableAudioBlock({
  block,
  settings,
  onUpdate,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: EditableBlockProps) {
  const { props } = block;

  const updateProp = (key: string, value: any) => {
    onUpdate({ ...props, [key]: value });
  };

  const {
    audioUrl = '',
    albumArt = '',
    title = 'Track Title',
    artist = 'Artist Name',
  } = props;

  return (
    <BlockEditWrapper
      block={block}
      onUpdate={onUpdate}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <EditableAudio
        src={audioUrl}
        albumArt={albumArt}
        title={title}
        artist={artist}
        onChange={(url) => updateProp('audioUrl', url)}
        onAlbumArtChange={(url) => updateProp('albumArt', url)}
        onTitleChange={(val) => updateProp('title', val)}
        onArtistChange={(val) => updateProp('artist', val)}
        style={{ borderRadius: settings.borders.radius }}
      />
    </BlockEditWrapper>
  );
}

// ============ Editable Card Block ============
export function EditableCardBlock({
  block,
  settings,
  onUpdate,
  isSelected,
  onSelect,
  onDelete,
  onDuplicate,
}: EditableBlockProps) {
  const { props } = block;
  const [showImagePicker, setShowImagePicker] = useState(false);

  const updateProp = (key: string, value: any) => {
    onUpdate({ ...props, [key]: value });
  };

  const {
    image = '',
    title = 'Card Title',
    description = 'Card description goes here...',
    buttonText = 'Learn More',
    buttonUrl = '#',
  } = props;

  return (
    <BlockEditWrapper
      block={block}
      onUpdate={onUpdate}
      isSelected={isSelected}
      onSelect={onSelect}
      onDelete={onDelete}
      onDuplicate={onDuplicate}
    >
      <div
        className="overflow-hidden"
        style={{
          backgroundColor: settings.colors.surface,
          borderRadius: settings.borders.radius,
        }}
      >
        {/* Card Image */}
        <div
          className="relative h-48 bg-gray-700 cursor-pointer group"
          onClick={(e) => {
            e.stopPropagation();
            setShowImagePicker(true);
          }}
        >
          {image ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FiImage size={32} className="text-gray-500" />
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
            <span className="text-white text-sm">Click to change image</span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-6">
          <EditableText
            value={title}
            onChange={(val) => updateProp('title', val)}
            placeholder="Card title..."
            className="text-xl font-semibold mb-2"
            style={{ color: settings.colors.heading }}
            tag="h3"
          />

          <EditableText
            value={description}
            onChange={(val) => updateProp('description', val)}
            placeholder="Card description..."
            className="mb-4"
            style={{ color: settings.colors.textMuted }}
            multiline
          />

          <EditableText
            value={buttonText}
            onChange={(val) => updateProp('buttonText', val)}
            placeholder="Button text..."
            className="inline-block px-4 py-2 font-medium text-white"
            style={{
              backgroundColor: settings.colors.primary,
              borderRadius: settings.borders.radius,
            }}
          />
        </div>
      </div>

      {showImagePicker && (
        <MediaPickerModal
          type="image"
          onSelect={(media) => {
            updateProp('image', media.path || media.url);
            setShowImagePicker(false);
          }}
          onClose={() => setShowImagePicker(false)}
        />
      )}
    </BlockEditWrapper>
  );
}

// ============ Block Type to Editable Component Map ============
export const EDITABLE_BLOCK_MAP: Record<string, React.ComponentType<EditableBlockProps>> = {
  hero: EditableHeroBlock,
  testimonial: EditableTestimonialBlock,
  features: EditableFeaturesBlock,
  cta: EditableCTABlock,
  gallery: EditableGalleryBlock,
  video: EditableVideoBlock,
  audio: EditableAudioBlock,
  card: EditableCardBlock,
};

// ============ Get Editable Block Component ============
export function getEditableBlock(blockType: string): React.ComponentType<EditableBlockProps> | null {
  return EDITABLE_BLOCK_MAP[blockType] || null;
}

// ============ Check if Block is Editable ============
export function isBlockEditable(blockType: string): boolean {
  return blockType in EDITABLE_BLOCK_MAP;
}
