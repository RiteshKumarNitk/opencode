'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { useState } from 'react';

const statusConfig: Record<string, { bg: string; text: string; icon: string; next?: string }> = {
  PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '⏳', next: 'CONFIRMED' },
  CONFIRMED: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '✅', next: 'PROCESSING' },
  PROCESSING: { bg: 'bg-purple-50', text: 'text-purple-700', icon: '📦', next: 'SHIPPED' },
  SHIPPED: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: '🚚', next: 'DELIVERED' },
  DELIVERED: { bg: 'bg-green-50', text: 'text-green-700', icon: '🎉' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', icon: '❌' },
  REFUNDED: { bg: 'bg-gray-50', text: 'text-gray-700', icon: '💰' },
};

export default function AdminOrdersPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', statusFilter],
    queryFn: () => {
      const params: Record<string, string> = { limit: '50' };
      if (statusFilter) params.status = statusFilter;
      return adminApi.orders(params);
    },
  });

  const orders = data?.data || data || [];

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const accessToken = token?.state?.accessToken;
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify({ status: newStatus }),
      });
      refetch();
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-500 text-sm mt-1">Manage orders and delivery status</p>
        </div>
        <div className="flex gap-2">
          {['', 'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-6xl mb-4">📦</p>
          <p className="text-gray-500">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => {
            const st = statusConfig[order.status] || statusConfig.PENDING;
            const isExpanded = expandedId === order.id;
            return (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-5 cursor-pointer hover:bg-gray-50/50 transition" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{st.icon}</span>
                        <p className="font-bold text-gray-900">{order.orderNumber}</p>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold ${st.bg} ${st.text}`}>{order.status}</span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {order.user?.firstName} {order.user?.lastName} &middot; {order.user?.email}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">₹{Number(order.totalAmount).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">{order.items?.length} item(s)</p>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50/30">
                    {/* Items */}
                    <div className="mb-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Items</h3>
                      <div className="space-y-2">
                        {order.items?.map((item: any) => (
                          <div key={item.id} className="flex justify-between text-sm">
                            <span className="text-gray-700">{item.productName} x {item.quantity}</span>
                            <span className="font-medium">₹{Number(item.totalPrice).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Actions */}
                    {st.next && (
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(order.id, st.next!)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
                          Mark as {st.next}
                        </button>
                        {['PENDING', 'CONFIRMED', 'PROCESSING'].includes(order.status) && (
                          <button onClick={() => updateStatus(order.id, 'CANCELLED')}
                            className="px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition">
                            Cancel Order
                          </button>
                        )}
                      </div>
                    )}

                    {/* Delivery Progress */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Timeline</h3>
                      <div className="space-y-0">
                        {[
                          { status: 'PENDING', label: 'Order Placed', icon: '⏳', timeField: 'createdAt' },
                          { status: 'CONFIRMED', label: 'Confirmed', icon: '✅', timeField: 'confirmedAt' },
                          { status: 'PROCESSING', label: 'Processing', icon: '📦', timeField: 'processingAt' },
                          { status: 'SHIPPED', label: 'Shipped', icon: '🚚', timeField: 'shippedAt' },
                          { status: 'DELIVERED', label: 'Delivered', icon: '🎉', timeField: 'deliveredAt' },
                        ].map((step, idx, arr) => {
                          const steps = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
                          const currentIdx = steps.indexOf(order.status);
                          const stepIdx = steps.indexOf(step.status);
                          const isDone = currentIdx >= stepIdx;
                          const isCurrent = currentIdx === stepIdx;
                          const timestamp = order[step.timeField];
                          return (
                            <div key={step.status} className="flex items-start gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm flex-shrink-0 ${
                                  isDone
                                    ? isCurrent
                                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                      : 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-400'
                                }`}>
                                  {step.icon}
                                </div>
                                {idx < arr.length - 1 && (
                                  <div className={`w-0.5 h-6 ${isDone && !isCurrent ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                                )}
                              </div>
                              <div className="pt-1.5">
                                <p className={`text-sm font-medium ${isDone ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                                {timestamp ? (
                                  <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(timestamp).toLocaleDateString('en-IN', {
                                      day: 'numeric', month: 'short', year: 'numeric',
                                      hour: '2-digit', minute: '2-digit',
                                    })}
                                  </p>
                                ) : (
                                  isDone && <p className="text-xs text-gray-300 mt-0.5">Pending</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
