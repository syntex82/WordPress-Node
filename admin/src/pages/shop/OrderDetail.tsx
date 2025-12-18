/**
 * Order Detail Page
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ordersApi, Order } from '../../services/api';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) loadOrder(id);
  }, [id]);

  const loadOrder = async (orderId: string) => {
    try {
      setLoading(true);
      const { data } = await ordersApi.getById(orderId);
      setOrder(data);
    } catch (error) {
      console.error('Failed to load order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!order) return;
    try {
      setUpdating(true);
      await ordersApi.updateStatus(order.id, status);
      loadOrder(order.id);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleRefund = async () => {
    if (!order || !confirm('Are you sure you want to refund this order?')) return;
    try {
      setUpdating(true);
      await ordersApi.refund(order.id);
      loadOrder(order.id);
    } catch (error) {
      console.error('Failed to refund order:', error);
      alert('Failed to refund order');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!order || !confirm('Are you sure you want to cancel this order?')) return;
    try {
      setUpdating(true);
      await ordersApi.cancel(order.id);
      loadOrder(order.id);
    } catch (error) {
      console.error('Failed to cancel order:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return (
    <div className="p-6 flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-4 border-slate-700 border-t-blue-500"></div>
    </div>
  );
  if (!order) return <div className="p-6 text-slate-400">Order not found</div>;

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">Order {order.orderNumber}</h1>
          <p className="text-slate-400">{new Date(order.createdAt).toLocaleString()}</p>
        </div>
        <button onClick={() => navigate('/shop/orders')} className="text-blue-400 hover:text-blue-300 transition-colors">
          ← Back to Orders
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Order Info */}
        <div className="col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Order Items</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left py-2 text-slate-400">Product</th>
                  <th className="text-right py-2 text-slate-400">Price</th>
                  <th className="text-right py-2 text-slate-400">Qty</th>
                  <th className="text-right py-2 text-slate-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-700/50">
                    <td className="py-2">
                      <div className="text-white">{item.name}</div>
                      {item.sku && <div className="text-sm text-slate-500">SKU: {item.sku}</div>}
                    </td>
                    <td className="text-right py-2 text-slate-300">${Number(item.price).toFixed(2)}</td>
                    <td className="text-right py-2 text-slate-300">{item.quantity}</td>
                    <td className="text-right py-2 text-white">${Number(item.total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="text-slate-300">
                <tr><td colSpan={3} className="text-right py-2">Subtotal</td><td className="text-right py-2">${Number(order.subtotal).toFixed(2)}</td></tr>
                <tr><td colSpan={3} className="text-right py-2">Tax</td><td className="text-right py-2">${Number(order.tax).toFixed(2)}</td></tr>
                <tr><td colSpan={3} className="text-right py-2">Shipping</td><td className="text-right py-2">${Number(order.shipping).toFixed(2)}</td></tr>
                {Number(order.discount) > 0 && <tr><td colSpan={3} className="text-right py-2">Discount</td><td className="text-right py-2 text-green-400">-${Number(order.discount).toFixed(2)}</td></tr>}
                <tr className="font-bold text-white"><td colSpan={3} className="text-right py-2">Total</td><td className="text-right py-2">${Number(order.total).toFixed(2)}</td></tr>
              </tfoot>
            </table>
          </div>

          {/* Payments */}
          {order.payments && order.payments.length > 0 && (
            <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Payments</h2>
              {order.payments.map((payment) => (
                <div key={payment.id} className="flex justify-between py-2 border-b border-slate-700/50">
                  <div>
                    <div className="text-white">{payment.method}</div>
                    <div className="text-sm text-slate-500">{payment.stripePaymentIntentId}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-white">${Number(payment.amount).toFixed(2)}</div>
                    <div className="text-sm text-slate-400">{payment.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Status</h2>
            <select
              value={order.status}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={updating}
              className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-3 py-2 mb-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <div className="flex gap-2">
              {order.paymentStatus === 'PAID' && order.status !== 'REFUNDED' && (
                <button onClick={handleRefund} disabled={updating} className="flex-1 bg-orange-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-orange-700 disabled:opacity-50 transition-colors">Refund</button>
              )}
              {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                <button onClick={handleCancel} disabled={updating} className="flex-1 bg-red-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-red-700 disabled:opacity-50 transition-colors">Cancel</button>
              )}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700/50 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Customer</h2>
            <p className="text-slate-300">{order.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

