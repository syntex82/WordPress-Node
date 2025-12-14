/**
 * Product Detail Page (Modern Design)
 */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { storefrontApi, cartApi, Product } from '../../services/api';
import toast from 'react-hot-toast';

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (slug) loadProduct(slug);
  }, [slug]);

  const loadProduct = async (productSlug: string) => {
    try {
      setLoading(true);
      const { data } = await storefrontApi.getProduct(productSlug);
      setProduct(data);
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0].id);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    console.log('Adding to cart:', { productId: product.id, quantity, variantId: selectedVariant });
    try {
      setAdding(true);
      const response = await cartApi.add(product.id, quantity, selectedVariant || undefined);
      console.log('Cart response:', response.data);
      toast.success('Added to cart!');
      navigate('/shop/cart');
    } catch (error: any) {
      console.error('Failed to add to cart - Full error:', error);
      console.error('Error response:', error?.response);
      console.error('Error status:', error?.response?.status);
      console.error('Error data:', error?.response?.data);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to add to cart';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">😕</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Product not found</h2>
        <Link to="/shop" className="text-violet-600 hover:underline">Back to shop</Link>
      </div>
    </div>
  );

  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/shop" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl">🛍️</span>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Shop</span>
            </Link>
            <Link to="/shop/cart" className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-5 py-2.5 rounded-full font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all hover:scale-105">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              Cart
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm mb-8">
          <Link to="/shop" className="text-violet-600 hover:text-violet-700 font-medium">Shop</Link>
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-slate-500">{product.name}</span>
        </nav>

        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image Gallery */}
            <div className="bg-gradient-to-br from-slate-100 to-slate-50 p-8">
              <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-white shadow-lg">
                {product.images?.[selectedImage] ? (
                  <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 justify-center">
                  {product.images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)} className={`w-20 h-20 rounded-xl overflow-hidden transition-all ${i === selectedImage ? 'ring-4 ring-violet-500 ring-offset-2 scale-105' : 'opacity-60 hover:opacity-100'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="p-10 flex flex-col">
              {product.salePrice && (
                <div className="inline-flex self-start bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-4 shadow-lg shadow-rose-500/25">
                  🔥 ON SALE
                </div>
              )}

              <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-3">{product.name}</h1>
              {product.sku && <p className="text-sm text-slate-400 mb-6">SKU: {product.sku}</p>}

              <div className="flex items-baseline gap-4 mb-6">
                {product.salePrice ? (
                  <>
                    <span className="text-4xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">${Number(product.salePrice).toFixed(2)}</span>
                    <span className="text-2xl text-slate-400 line-through">${Number(product.price).toFixed(2)}</span>
                    <span className="bg-rose-100 text-rose-600 text-sm font-semibold px-3 py-1 rounded-full">
                      Save ${(Number(product.price) - Number(product.salePrice)).toFixed(2)}
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-bold text-slate-900">${Number(product.price).toFixed(2)}</span>
                )}
              </div>

              <p className="text-slate-600 text-lg leading-relaxed mb-8">{product.description}</p>

              {/* Variants */}
              {product.variants && product.variants.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Options</label>
                  <select value={selectedVariant || ''} onChange={(e) => setSelectedVariant(e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-violet-500 transition-colors">
                    {product.variants.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} - ${Number(v.price).toFixed(2)}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quantity */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Quantity</label>
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-12 h-12 rounded-lg bg-white shadow-sm text-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors">−</button>
                  <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 h-12 text-center bg-transparent font-semibold text-lg focus:outline-none" />
                  <button onClick={() => setQuantity(q => Math.min(product.stock, q + 1))} className="w-12 h-12 rounded-lg bg-white shadow-sm text-xl font-medium text-slate-600 hover:bg-slate-50 transition-colors">+</button>
                </div>
              </div>

              {/* Stock Status */}
              <div className={`flex items-center gap-2 mb-8 ${inStock ? 'text-emerald-600' : 'text-rose-600'}`}>
                {inStock ? (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span className="font-medium">In Stock ({product.stock} available)</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    <span className="font-medium">Out of Stock</span>
                  </>
                )}
              </div>

              {/* Add to Cart */}
              <button onClick={handleAddToCart} disabled={!inStock || adding} className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white py-4 rounded-xl font-semibold text-lg shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-3">
                {adding ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                    Add to Cart
                  </>
                )}
              </button>

              {/* Trust Badges */}
              <div className="mt-8 pt-8 border-t border-slate-200 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl mb-1">🚚</div>
                  <div className="text-xs text-slate-500 font-medium">Free Shipping</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">🔒</div>
                  <div className="text-xs text-slate-500 font-medium">Secure Payment</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">↩️</div>
                  <div className="text-xs text-slate-500 font-medium">Easy Returns</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

