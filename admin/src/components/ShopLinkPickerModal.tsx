/**
 * Shop Link Picker Modal
 * Allows selecting products, categories, or shop page for linking
 */
import { useState, useEffect } from 'react';
import { FiX, FiShoppingCart, FiShoppingBag, FiGrid } from 'react-icons/fi';
import { menusApi } from '../services/api';

interface ShopLinkPickerModalProps {
  onSelect: (url: string, label: string) => void;
  onClose: () => void;
}

type LinkType = 'shop' | 'product' | 'category';

export default function ShopLinkPickerModal({ onSelect, onClose }: ShopLinkPickerModalProps) {
  const [linkType, setLinkType] = useState<LinkType>('shop');
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data } = await menusApi.getAvailableLinks();
      setProducts(data.products || []);
      setCategories(data.productCategories || []);
    } catch (error) {
      console.error('Failed to load shop data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    let url = '';
    let label = '';

    if (linkType === 'shop') {
      url = '/shop';
      label = 'Shop';
    } else if (linkType === 'product' && selectedId) {
      const product = products.find(p => p.id === selectedId);
      if (product) {
        url = `/shop/product/${product.slug}`;
        label = product.name;
      }
    } else if (linkType === 'category' && selectedId) {
      const category = categories.find(c => c.id === selectedId);
      if (category) {
        url = `/shop?category=${category.slug}`;
        label = category.name;
      }
    }

    if (url) {
      onSelect(url, label);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Insert Shop Link</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FiX size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Link Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setLinkType('shop'); setSelectedId(''); }}
                className={`flex flex-col items-center p-3 rounded-lg border ${
                  linkType === 'shop' ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <FiShoppingCart className="w-5 h-5 mb-1" />
                <span className="text-xs">Shop Page</span>
              </button>
              <button
                onClick={() => { setLinkType('product'); setSelectedId(''); }}
                className={`flex flex-col items-center p-3 rounded-lg border ${
                  linkType === 'product' ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <FiShoppingBag className="w-5 h-5 mb-1" />
                <span className="text-xs">Product</span>
              </button>
              <button
                onClick={() => { setLinkType('category'); setSelectedId(''); }}
                className={`flex flex-col items-center p-3 rounded-lg border ${
                  linkType === 'category' ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <FiGrid className="w-5 h-5 mb-1" />
                <span className="text-xs">Category</span>
              </button>
            </div>
          </div>

          {/* Product/Category Selection */}
          {linkType === 'product' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Product</label>
              {loading ? (
                <div className="text-gray-500 text-sm">Loading...</div>
              ) : (
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Choose a product...</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {linkType === 'category' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Category</label>
              {loading ? (
                <div className="text-gray-500 text-sm">Loading...</div>
              ) : (
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-violet-500"
                >
                  <option value="">Choose a category...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button
              onClick={handleSelect}
              disabled={(linkType !== 'shop' && !selectedId)}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
            >
              Insert Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

