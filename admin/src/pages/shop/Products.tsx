/**
 * Products Management Page
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, categoriesApi, Product, ProductCategory } from '../../services/api';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [page, statusFilter, categoryFilter]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data } = await productsApi.getAll({
        page,
        limit: 20,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        search: search || undefined,
      });
      setProducts(data.products);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data } = await categoriesApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsApi.delete(id);
      loadProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PUBLISHED: 'bg-green-500/20 text-green-400',
      DRAFT: 'bg-yellow-500/20 text-yellow-400',
      ARCHIVED: 'bg-slate-500/20 text-slate-400',
    };
    return colors[status] || 'bg-slate-500/20 text-slate-400';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Products</h1>
        <Link
          to="/shop/products/new"
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-500/20 transition-all"
        >
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 flex-1 min-w-[200px] text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Status</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <button type="submit" className="bg-slate-700/50 border border-slate-600/50 text-slate-300 px-4 py-2 rounded-xl hover:bg-slate-600/50 transition-colors">
            Search
          </button>
        </form>
      </div>

      {/* Products Table */}
      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No products found</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-700/30 border-b border-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">SKU</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Stock</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.images?.[0] && (
                        <img src={product.images[0]} alt="" className="w-10 h-10 object-cover rounded-lg" />
                      )}
                      <div>
                        <div className="font-medium text-white">{product.name}</div>
                        <div className="text-sm text-slate-500">{product.category?.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{product.sku || '-'}</td>
                  <td className="px-4 py-3 text-white">
                    {product.salePrice ? (
                      <div>
                        <span className="line-through text-slate-500">${product.price}</span>
                        <span className="ml-2 text-green-400">${product.salePrice}</span>
                      </div>
                    ) : (
                      <span>${product.price}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={product.stock <= product.lowStockThreshold ? 'text-red-400' : 'text-white'}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-lg text-xs ${getStatusBadge(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link
                        to={`/shop/products/${product.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-400 hover:text-red-300 text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-slate-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border border-slate-600/50 rounded-xl text-slate-300 hover:bg-slate-700/50 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

