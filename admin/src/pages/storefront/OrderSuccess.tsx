/**
 * Order Success Page
 */
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { checkoutApi, Order } from '../../services/api';

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('order');
  const redirectStatus = searchParams.get('redirect_status');

  useEffect(() => {
    if (orderId) loadOrder(orderId);
    else setLoading(false);
  }, [orderId]);

  const loadOrder = async (id: string) => {
    try {
      const { data } = await checkoutApi.getOrder(id);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your order...</p>
        </div>
      </div>
    );
  }

  const isSuccess = redirectStatus === 'succeeded' || order?.paymentStatus === 'PAID';
  const isFailed = redirectStatus === 'failed' || order?.paymentStatus === 'FAILED';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link to="/shop" className="text-2xl font-bold text-gray-900">Shop</Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          {isSuccess ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✓</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Thank You!</h1>
              <p className="text-gray-600 mb-6">Your order has been placed successfully.</p>

              {order && (
                <div className="bg-gray-50 rounded-lg p-6 text-left mb-6">
                  <h2 className="font-semibold mb-4">Order Details</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Order Number:</span>
                      <span className="font-medium">{order.orderNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Email:</span>
                      <span>{order.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="text-green-600 font-medium">{order.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total:</span>
                      <span className="font-bold text-lg">${Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h3 className="font-medium mb-2">Items</h3>
                      {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm py-1">
                          <span>{item.name} × {item.quantity}</span>
                          <span>${Number(item.total).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-gray-500 mb-6">
                A confirmation email has been sent to your email address.
              </p>
            </>
          ) : isFailed ? (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">✗</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
              <p className="text-gray-600 mb-6">
                We couldn't process your payment. Please try again.
              </p>
              <Link to="/shop/checkout" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
                Try Again
              </Link>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⏳</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Processing Payment</h1>
              <p className="text-gray-600 mb-6">
                Your payment is being processed. You'll receive a confirmation email shortly.
              </p>
            </>
          )}

          <Link to="/shop" className="inline-block text-blue-600 hover:underline">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}

