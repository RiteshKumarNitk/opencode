'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersApi, cartApi, authApi } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores';
import Link from 'next/link';

export default function DashboardPage() {
  const { isAuthenticated, user } = useAuthStore();

  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
    enabled: isAuthenticated,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => ordersApi.list({ limit: '100' }),
    enabled: isAuthenticated,
  });

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-gray-500 text-lg mb-4">Please login to view your dashboard</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const meData = me as any;
  const orders = (ordersData as any)?.data || ordersData || [];
  const cartItems = (cart as any)?.items || [];

  const totalOrders = orders.length;
  const totalSpent = orders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0);
  const pendingOrders = orders.filter((o: any) => ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)).length;
  const deliveredOrders = orders.filter((o: any) => o.status === 'DELIVERED').length;
  const cancelledOrders = orders.filter((o: any) => o.status === 'CANCELLED').length;

  const recentOrders = orders.slice(0, 5);

  const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '⏳' },
    CONFIRMED: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '✅' },
    PROCESSING: { bg: 'bg-purple-50', text: 'text-purple-700', icon: '📦' },
    SHIPPED: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: '🚚' },
    DELIVERED: { bg: 'bg-green-50', text: 'text-green-700', icon: '🎉' },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', icon: '❌' },
    REFUNDED: { bg: 'bg-gray-50', text: 'text-gray-700', icon: '💰' },
  };

  const userName = meData?.firstName || user?.firstName || 'User';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userName}!</h1>
        <p className="text-gray-500 mt-1">Here&apos;s your account overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total Orders</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">₹{totalSpent.toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total Spent</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
          <p className="text-xs text-gray-400 mt-0.5">In Progress</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{cartItems.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">Items in Cart</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-xl">🎉</div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{deliveredOrders}</p>
            <p className="text-xs text-gray-400">Delivered</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-xl">❌</div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{cancelledOrders}</p>
            <p className="text-xs text-gray-400">Cancelled</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-xl">🔄</div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{pendingOrders}</p>
            <p className="text-xs text-gray-400">In Transit</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
            <Link href="/orders" className="text-sm text-indigo-600 font-medium">View All</Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📦</p>
              <p className="text-gray-500">No orders yet</p>
              <Link href="/products" className="text-indigo-600 font-medium text-sm mt-2 inline-block">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order: any) => {
                const status = statusConfig[order.status] || statusConfig.PENDING;
                return (
                  <Link key={order.id} href={`/orders/${order.id}`} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{status.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{order.orderNumber}</p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{Number(order.totalAmount).toLocaleString()}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${status.bg} ${status.text}`}>{order.status}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Account Info</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{userName[0]}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
                <p className="text-xs text-gray-400 truncate">{meData?.email || user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm text-gray-600 capitalize">{user?.role?.toLowerCase() || 'customer'} account</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <Link href="/orders" className="block w-full text-left px-4 py-2.5 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              📦 My Orders
            </Link>
            <Link href="/wishlist" className="block w-full text-left px-4 py-2.5 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              ❤️ Wishlist
            </Link>
            <Link href="/profile" className="block w-full text-left px-4 py-2.5 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              👤 Edit Profile
            </Link>
            <Link href="/cart" className="block w-full text-left px-4 py-2.5 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition">
              🛒 My Cart
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}