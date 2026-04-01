'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api-client';
import Link from 'next/link';

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list(),
  });

  const orders = data?.data || data || [];

  const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '⏳' },
    CONFIRMED: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '✅' },
    PROCESSING: { bg: 'bg-purple-50', text: 'text-purple-700', icon: '📦' },
    SHIPPED: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: '🚚' },
    DELIVERED: { bg: 'bg-green-50', text: 'text-green-700', icon: '🎉' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', icon: '❌' },
    REFUNDED: { bg: 'bg-gray-50', text: 'text-gray-700', icon: '💰' },
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-500 text-lg mb-2">No orders yet</p>
          <p className="text-gray-400 text-sm mb-6">Your orders will appear here once you make a purchase</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any, idx: number) => {
            const status = statusConfig[order.status] || statusConfig.PENDING;
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-6 card-hover animate-fade-in-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{status.icon}</span>
                      <p className="font-bold text-gray-900">{order.orderNumber}</p>
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${status.bg} ${status.text}`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {order.items?.slice(0, 4).map((item: any, i: number) => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white overflow-hidden">
                        {item.product?.images?.[0] && (
                          <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">
                      {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{Number(order.totalAmount).toLocaleString()}</p>
                    <p className="text-xs text-indigo-600 font-medium">View Details →</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
