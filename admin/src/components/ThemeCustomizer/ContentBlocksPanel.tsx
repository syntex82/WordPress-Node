/**
 * Content Blocks Panel - Advanced Version
 * Features: Drag-and-drop reordering, templates, visibility toggle, rich editing, downloads
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiPlus, FiTrash2, FiEdit2, FiX, FiSave, FiLayout as FiLayoutIcon,
  FiMove, FiEye, FiEyeOff, FiCopy, FiDownload, FiCheckSquare, FiSquare,
  FiChevronUp, FiChevronDown, FiColumns, FiCode, FiExternalLink
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { themeCustomizationApi, customThemesApi, ThemeCustomizationBlock } from '../../services/api';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ContentBlocksPanelProps {
  themeId: string;
}

const BLOCK_TYPES = [
  { id: 'hero', label: 'Hero Section', icon: '🏠', color: 'purple', description: 'Large banner with title and CTA' },
  { id: 'features', label: 'Features', icon: '⚡', color: 'blue', description: 'Feature cards grid' },
  { id: 'testimonials', label: 'Testimonials', icon: '💬', color: 'green', description: 'Customer reviews' },
  { id: 'cta', label: 'Call to Action', icon: '📢', color: 'orange', description: 'Action-focused section' },
  { id: 'gallery', label: 'Gallery', icon: '🖼️', color: 'pink', description: 'Image gallery grid' },
  { id: 'text', label: 'Text Block', icon: '📝', color: 'gray', description: 'Rich text content' },
  { id: 'pricing', label: 'Pricing', icon: '💰', color: 'yellow', description: 'Pricing table' },
  { id: 'team', label: 'Team', icon: '👥', color: 'indigo', description: 'Team members grid' },
  { id: 'faq', label: 'FAQ', icon: '❓', color: 'teal', description: 'Frequently asked questions' },
  { id: 'contact', label: 'Contact', icon: '✉️', color: 'red', description: 'Contact form section' },
  { id: 'custom', label: 'Custom', icon: '✨', color: 'gray', description: 'Custom HTML/content' },
];

const LAYOUT_OPTIONS = [
  { id: 'full-width', label: 'Full Width', icon: '▬' },
  { id: 'contained', label: 'Contained', icon: '▭' },
  { id: 'grid', label: 'Grid', icon: '⊞' },
  { id: 'flex', label: 'Flex', icon: '⋮⋮' },
];

// Sortable Block Card Component
function SortableBlockCard({
  block,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleVisibility,
  isExpanded,
  onToggleExpand
}: {
  block: ThemeCustomizationBlock;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (block: ThemeCustomizationBlock) => void;
  onDelete: (id: string) => void;
  onDuplicate: (block: ThemeCustomizationBlock) => void;
  onToggleVisibility: (block: ThemeCustomizationBlock) => void;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const typeInfo = BLOCK_TYPES.find(t => t.id === block.type) || BLOCK_TYPES[10];
  const layoutInfo = LAYOUT_OPTIONS.find(l => l.id === block.layout) || LAYOUT_OPTIONS[1];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-xl overflow-hidden transition-all border-2 ${
        isDragging
          ? 'bg-indigo-900/50 border-indigo-500 shadow-2xl scale-[1.02]'
          : isSelected
            ? 'bg-gray-700/80 border-indigo-500'
            : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
      } ${!block.isVisible ? 'opacity-60' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Selection */}
        <button onClick={() => onSelect(block.id)} className="flex-shrink-0 text-gray-400 hover:text-indigo-400">
          {isSelected ? <FiCheckSquare size={20} className="text-indigo-400" /> : <FiSquare size={20} />}
        </button>

        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-white">
          <FiMove size={18} />
        </div>

        {/* Position Badge */}
        <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-300">
          {index + 1}
        </div>

        {/* Type Icon & Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{typeInfo.icon}</span>
            <h4 className="text-white font-semibold truncate">{block.name}</h4>
            <span className={`px-2 py-0.5 text-xs rounded-full bg-${typeInfo.color}-500/20 text-${typeInfo.color}-300 capitalize`}>
              {block.type}
            </span>
            {!block.isVisible && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-gray-600 text-gray-300 flex items-center gap-1">
                <FiEyeOff size={12} /> Hidden
              </span>
            )}
          </div>
          {block.title && (
            <p className="text-gray-400 text-sm mt-1 truncate">{block.title}</p>
          )}
        </div>

        {/* Layout Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 rounded-lg">
          <span className="text-gray-400">{layoutInfo.icon}</span>
          <span className="text-gray-300 text-sm">{layoutInfo.label}</span>
          <span className="text-gray-500 mx-1">•</span>
          <FiColumns size={14} className="text-gray-400" />
          <span className="text-gray-300 text-sm">{block.columns} col</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleVisibility(block)}
            className={`p-2 rounded-lg transition-colors ${block.isVisible ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-gray-600 text-gray-400 hover:bg-gray-500'}`}
            title={block.isVisible ? 'Hide block' : 'Show block'}
          >
            {block.isVisible ? <FiEye size={16} /> : <FiEyeOff size={16} />}
          </button>
          <button onClick={() => onDuplicate(block)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300" title="Duplicate">
            <FiCopy size={16} />
          </button>
          <button onClick={() => onEdit(block)} className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white" title="Edit">
            <FiEdit2 size={16} />
          </button>
          <button onClick={() => onDelete(block.id)} className="p-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-white" title="Delete">
            <FiTrash2 size={16} />
          </button>
          <button onClick={() => onToggleExpand(block.id)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-300">
            {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-700 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h5 className="text-gray-400 text-sm mb-2 flex items-center gap-2">
                <FiCode size={14} /> Content Preview
              </h5>
              <p className="text-gray-300 text-sm line-clamp-4">{block.content || 'No content'}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h5 className="text-gray-400 text-sm mb-2">Block Settings</h5>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Layout:</span>
                  <span className="text-gray-300 ml-2">{block.layout}</span>
                </div>
                <div>
                  <span className="text-gray-500">Columns:</span>
                  <span className="text-gray-300 ml-2">{block.columns}</span>
                </div>
                <div>
                  <span className="text-gray-500">Position:</span>
                  <span className="text-gray-300 ml-2">{block.position}</span>
                </div>
                <div>
                  <span className="text-gray-500">Visible:</span>
                  <span className={`ml-2 ${block.isVisible ? 'text-green-400' : 'text-red-400'}`}>
                    {block.isVisible ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContentBlocksPanel({ themeId }: ContentBlocksPanelProps) {
  const [blocks, setBlocks] = useState<ThemeCustomizationBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBlock, setEditingBlock] = useState<ThemeCustomizationBlock | null>(null);
  const [editData, setEditData] = useState<Partial<ThemeCustomizationBlock>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('');
  const [isCustomTheme, setIsCustomTheme] = useState(false);
  const [customThemeBlockCount, setCustomThemeBlockCount] = useState(0);
  const [newBlock, setNewBlock] = useState<Partial<ThemeCustomizationBlock>>({
    name: '',
    type: 'text',
    title: '',
    content: '',
    layout: 'contained',
    columns: 1,
    isVisible: true,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    loadBlocks();
  }, [themeId]);

  const loadBlocks = async () => {
    try {
      setLoading(true);
      // First try to load from ThemeCustomizationBlock (installed themes)
      const response = await themeCustomizationApi.getBlocks(themeId);
      if (response.data && response.data.length > 0) {
        setBlocks(response.data.sort((a: ThemeCustomizationBlock, b: ThemeCustomizationBlock) => a.position - b.position));
        setIsCustomTheme(false);
      } else {
        // Check if this is a CustomTheme with pages/blocks
        try {
          const customThemeResponse = await customThemesApi.getById(themeId);
          if (customThemeResponse.data && customThemeResponse.data.pages) {
            const pages = customThemeResponse.data.pages as any[];
            const totalBlocks = pages.reduce((acc, page) => acc + (page.blocks?.length || 0), 0);
            setIsCustomTheme(true);
            setCustomThemeBlockCount(totalBlocks);
            setBlocks([]);
          }
        } catch {
          // Not a CustomTheme either, just show empty
          setBlocks([]);
        }
      }
    } catch (err: any) {
      // Try CustomTheme as fallback
      try {
        const customThemeResponse = await customThemesApi.getById(themeId);
        if (customThemeResponse.data && customThemeResponse.data.pages) {
          const pages = customThemeResponse.data.pages as any[];
          const totalBlocks = pages.reduce((acc, page) => acc + (page.blocks?.length || 0), 0);
          setIsCustomTheme(true);
          setCustomThemeBlockCount(totalBlocks);
          setBlocks([]);
        }
      } catch {
        toast.error('Failed to load blocks');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex(b => b.id === active.id);
    const newIndex = blocks.findIndex(b => b.id === over.id);

    const newBlocks = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(newBlocks);

    try {
      await Promise.all(
        newBlocks.map((block, idx) =>
          themeCustomizationApi.updateBlock(block.id, { position: idx })
        )
      );
      toast.success('Order updated');
    } catch (err) {
      toast.error('Failed to update order');
      loadBlocks();
    }
  };

  const handleAddBlock = async () => {
    if (!newBlock.name || !newBlock.type) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const response = await themeCustomizationApi.createBlock(themeId, {
        ...newBlock,
        position: blocks.length,
      });
      setBlocks([...blocks, response.data]);
      setNewBlock({ name: '', type: 'text', title: '', content: '', layout: 'contained', columns: 1, isVisible: true });
      setShowAddModal(false);
      toast.success('Block added');
    } catch (err) {
      toast.error('Failed to add block');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('Delete this block?')) return;
    try {
      await themeCustomizationApi.deleteBlock(id);
      setBlocks(blocks.filter(b => b.id !== id));
      setSelectedIds(selectedIds.filter(sid => sid !== id));
      toast.success('Block deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} blocks?`)) return;

    try {
      await Promise.all(selectedIds.map(id => themeCustomizationApi.deleteBlock(id)));
      setBlocks(blocks.filter(b => !selectedIds.includes(b.id)));
      setSelectedIds([]);
      toast.success(`${selectedIds.length} blocks deleted`);
    } catch (err) {
      toast.error('Failed to delete some blocks');
    }
  };

  const handleDuplicate = async (block: ThemeCustomizationBlock) => {
    try {
      const response = await themeCustomizationApi.createBlock(themeId, {
        name: `${block.name} (Copy)`,
        type: block.type,
        title: block.title,
        content: block.content,
        layout: block.layout,
        columns: block.columns,
        isVisible: true,
        position: blocks.length,
      });
      setBlocks([...blocks, response.data]);
      toast.success('Block duplicated');
    } catch (err) {
      toast.error('Failed to duplicate');
    }
  };

  const handleToggleVisibility = async (block: ThemeCustomizationBlock) => {
    try {
      const response = await themeCustomizationApi.updateBlock(block.id, { isVisible: !block.isVisible });
      setBlocks(blocks.map(b => b.id === block.id ? response.data : b));
      toast.success(block.isVisible ? 'Block hidden' : 'Block visible');
    } catch (err) {
      toast.error('Failed to update visibility');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingBlock) return;
    try {
      const response = await themeCustomizationApi.updateBlock(editingBlock.id, editData);
      setBlocks(blocks.map(b => b.id === editingBlock.id ? response.data : b));
      setEditingBlock(null);
      setEditData({});
      toast.success('Block updated');
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleExport = () => {
    const exportData = { blocks, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-blocks-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Blocks exported');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]);
  };

  const filteredBlocks = filterType ? blocks.filter(b => b.type === filterType) : blocks;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-400">Loading blocks...</p>
        </div>
      </div>
    );
  }

  // Show redirect UI for CustomTheme blocks (AI-generated themes)
  if (isCustomTheme) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-2xl border border-indigo-500/30 p-8 text-center">
          <div className="w-16 h-16 bg-indigo-600/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiLayoutIcon size={32} className="text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">AI-Generated Theme Blocks</h3>
          <p className="text-gray-400 mb-2">
            This theme has <span className="text-indigo-400 font-semibold">{customThemeBlockCount} blocks</span> created by the AI Theme Generator.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            To edit these blocks, use the Theme Designer which provides a visual drag-and-drop editor.
          </p>
          <Link
            to="/admin/theme-designer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 transition-all"
          >
            <FiEdit2 size={18} />
            Open Theme Designer
            <FiExternalLink size={14} />
          </Link>
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              💡 Tip: In the Theme Designer, click any block to edit its content, style, and layout.
              You can also add new blocks, reorder them, and preview on different devices.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/30 transition-all"
          >
            <FiPlus size={20} />
            Add Block
          </button>

          <div className="h-8 w-px bg-gray-700 mx-2" />

          <button
            onClick={() => setFilterType('')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              filterType === '' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All ({blocks.length})
          </button>
          {BLOCK_TYPES.slice(0, 6).map(type => {
            const count = blocks.filter(b => b.type === type.id).length;
            if (count === 0) return null;
            return (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                  filterType === type.id ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <span>{type.icon}</span>
                <span className="hidden sm:inline">{type.label}</span>
                <span className="text-xs opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <>
              <span className="text-indigo-400 text-sm">{selectedIds.length} selected</span>
              <button onClick={handleBulkDelete} className="p-2 bg-red-600 hover:bg-red-500 rounded-lg text-white" title="Delete Selected">
                <FiTrash2 size={18} />
              </button>
              <div className="w-px h-6 bg-gray-600 mx-1" />
            </>
          )}
          <button onClick={handleExport} className="p-2 bg-green-600 hover:bg-green-500 rounded-lg text-white" title="Export Blocks">
            <FiDownload size={18} />
          </button>
        </div>
      </div>

      {/* Blocks List with Drag and Drop */}
      {filteredBlocks.length === 0 ? (
        <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-gray-700">
          <FiLayoutIcon className="mx-auto mb-4 text-gray-600" size={48} />
          <h3 className="text-xl font-medium text-gray-400 mb-2">No content blocks yet</h3>
          <p className="text-gray-500 mb-6">Add your first block to build your page</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium inline-flex items-center gap-2"
          >
            <FiPlus size={20} /> Add Your First Block
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredBlocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {filteredBlocks.map((block, index) => (
                <SortableBlockCard
                  key={block.id}
                  block={block}
                  index={index}
                  isSelected={selectedIds.includes(block.id)}
                  onSelect={toggleSelect}
                  onEdit={(b) => { setEditingBlock(b); setEditData(b); }}
                  onDelete={handleDeleteBlock}
                  onDuplicate={handleDuplicate}
                  onToggleVisibility={handleToggleVisibility}
                  isExpanded={expandedIds.includes(block.id)}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Block Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Add Content Block</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Block Type Selection */}
              <div>
                <label className="block text-sm text-gray-400 mb-3">Block Type</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {BLOCK_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setNewBlock({ ...newBlock, type: type.id })}
                      className={`p-4 rounded-xl text-left transition-all ${
                        newBlock.type === type.id
                          ? 'bg-indigo-600 ring-2 ring-indigo-400'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{type.icon}</span>
                      <h4 className="text-white font-medium">{type.label}</h4>
                      <p className="text-gray-400 text-xs mt-1">{type.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Block Name & Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Block Name *</label>
                  <input
                    type="text"
                    value={newBlock.name || ''}
                    onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                    placeholder="e.g., Homepage Hero"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Display Title</label>
                  <input
                    type="text"
                    value={newBlock.title || ''}
                    onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                    placeholder="e.g., Welcome to Our Site"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Layout & Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Layout</label>
                  <select
                    value={newBlock.layout || 'contained'}
                    onChange={(e) => setNewBlock({ ...newBlock, layout: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {LAYOUT_OPTIONS.map(layout => (
                      <option key={layout.id} value={layout.id}>{layout.icon} {layout.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Columns</label>
                  <select
                    value={newBlock.columns || 1}
                    onChange={(e) => setNewBlock({ ...newBlock, columns: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} Column{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm text-gray-400 mb-1">Content</label>
                <textarea
                  value={newBlock.content || ''}
                  onChange={(e) => setNewBlock({ ...newBlock, content: e.target.value })}
                  placeholder="Enter your block content here..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium">
                Cancel
              </button>
              <button onClick={handleAddBlock} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium flex items-center gap-2">
                <FiPlus size={18} /> Add Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Block Modal - Enhanced with rich content editing */}
      {editingBlock && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-auto shadow-2xl">
            <div className="p-6 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{BLOCK_TYPES.find(t => t.id === editData.type)?.icon || '📦'}</span>
                  <h2 className="text-xl font-bold text-white">Edit {BLOCK_TYPES.find(t => t.id === editData.type)?.label || 'Block'}</h2>
                </div>
                <button onClick={() => setEditingBlock(null)} className="p-2 hover:bg-gray-700 rounded-lg text-gray-400">
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Settings */}
              <div className="bg-gray-900/50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                  <FiLayoutIcon size={16} /> Basic Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Block Name</label>
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Type</label>
                    <select
                      value={editData.type || ''}
                      onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {BLOCK_TYPES.map(type => (
                        <option key={type.id} value={type.id}>{type.icon} {type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Layout</label>
                    <select
                      value={editData.layout || 'contained'}
                      onChange={(e) => setEditData({ ...editData, layout: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {LAYOUT_OPTIONS.map(layout => (
                        <option key={layout.id} value={layout.id}>{layout.icon} {layout.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Columns</label>
                    <select
                      value={editData.columns || 1}
                      onChange={(e) => setEditData({ ...editData, columns: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>{n} Column{n > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Content Settings - Dynamic based on block type */}
              <div className="bg-gray-900/50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                  <FiEdit2 size={16} /> Content
                </h3>

                {/* Title - for most block types */}
                <div className="mb-4">
                  <label className="block text-sm text-gray-400 mb-1">Title / Heading</label>
                  <input
                    type="text"
                    value={editData.title || (editData as any).richContent?.title || ''}
                    onChange={(e) => {
                      const richContent = (editData as any).richContent || {};
                      setEditData({
                        ...editData,
                        title: e.target.value,
                        richContent: { ...richContent, title: e.target.value }
                      } as any);
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter title..."
                  />
                </div>

                {/* Subtitle - for hero, cta blocks */}
                {['hero', 'cta', 'features', 'testimonials'].includes(editData.type || '') && (
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">Subtitle / Description</label>
                    <input
                      type="text"
                      value={(editData as any).richContent?.subtitle || (editData as any).richContent?.description || ''}
                      onChange={(e) => {
                        const richContent = (editData as any).richContent || {};
                        setEditData({
                          ...editData,
                          richContent: { ...richContent, subtitle: e.target.value, description: e.target.value }
                        } as any);
                      }}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter subtitle..."
                    />
                  </div>
                )}

                {/* CTA Button - for hero, cta blocks */}
                {['hero', 'cta'].includes(editData.type || '') && (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Button Text</label>
                      <input
                        type="text"
                        value={(editData as any).richContent?.ctaText || (editData as any).richContent?.buttonText || ''}
                        onChange={(e) => {
                          const richContent = (editData as any).richContent || {};
                          setEditData({
                            ...editData,
                            richContent: { ...richContent, ctaText: e.target.value, buttonText: e.target.value }
                          } as any);
                        }}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., Get Started"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Button URL</label>
                      <input
                        type="text"
                        value={(editData as any).richContent?.ctaUrl || (editData as any).richContent?.buttonLink || ''}
                        onChange={(e) => {
                          const richContent = (editData as any).richContent || {};
                          setEditData({
                            ...editData,
                            richContent: { ...richContent, ctaUrl: e.target.value, buttonLink: e.target.value }
                          } as any);
                        }}
                        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                        placeholder="e.g., /signup"
                      />
                    </div>
                  </div>
                )}

                {/* Background Image - for hero blocks */}
                {['hero', 'gallery'].includes(editData.type || '') && (
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-1">Background Image URL</label>
                    <input
                      type="text"
                      value={(editData as any).richContent?.backgroundImage || editData.backgroundImage || ''}
                      onChange={(e) => {
                        const richContent = (editData as any).richContent || {};
                        setEditData({
                          ...editData,
                          backgroundImage: e.target.value,
                          richContent: { ...richContent, backgroundImage: e.target.value }
                        } as any);
                      }}
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                      placeholder="https://..."
                    />
                  </div>
                )}

                {/* Content - for text, custom blocks */}
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Content / Body Text</label>
                  <textarea
                    value={editData.content || (editData as any).richContent?.content || ''}
                    onChange={(e) => {
                      const richContent = (editData as any).richContent || {};
                      setEditData({
                        ...editData,
                        content: e.target.value,
                        richContent: { ...richContent, content: e.target.value }
                      } as any);
                    }}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                    placeholder="Enter content..."
                  />
                </div>
              </div>

              {/* Style Settings */}
              <div className="bg-gray-900/50 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
                  <FiCode size={16} /> Styling
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Background Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={(editData as any).backgroundColor || '#1a1a2e'}
                        onChange={(e) => setEditData({ ...editData, backgroundColor: e.target.value } as any)}
                        className="w-12 h-12 rounded-lg border border-gray-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(editData as any).backgroundColor || ''}
                        onChange={(e) => setEditData({ ...editData, backgroundColor: e.target.value } as any)}
                        className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                        placeholder="#1a1a2e"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={(editData as any).textColor || '#ffffff'}
                        onChange={(e) => setEditData({ ...editData, textColor: e.target.value } as any)}
                        className="w-12 h-12 rounded-lg border border-gray-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={(editData as any).textColor || ''}
                        onChange={(e) => setEditData({ ...editData, textColor: e.target.value } as any)}
                        className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500"
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm text-gray-400 mb-1">Custom CSS</label>
                  <textarea
                    value={(editData as any).customCSS || ''}
                    onChange={(e) => setEditData({ ...editData, customCSS: e.target.value } as any)}
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-sm"
                    placeholder=".block { /* custom styles */ }"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex justify-end gap-3 sticky bottom-0 bg-gray-800">
              <button onClick={() => setEditingBlock(null)} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-medium">
                Cancel
              </button>
              <button onClick={handleSaveEdit} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium flex items-center gap-2">
                <FiSave size={18} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

