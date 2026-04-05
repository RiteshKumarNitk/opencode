'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminWishlistPage() {
  const [timeRange, setTimeRange] = useState('30');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-wishlist'],
    queryFn: () => adminApi.wishlist.list(),
  });

  const analytics = data as any;
  const popularProducts = analytics?.popularProducts || [];
  const recentActivity = analytics?.recentActivity || [];
  const topUsers = analytics?.topUsers || [];
  const stats = analytics?.stats || { totalWishlistItems: 0, totalUsersWithWishlists: 0 };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wishlist Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Track popular products and user wishlists</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-gray-900">{stats.totalWishlistItems}</p>
          <p className="text-sm text-gray-500">Total Wishlist Items</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsersWithWishlists}</p>
          <p className="text-sm text-gray-500">Users with Wishlists</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-gray-900">{popularProducts.length}</p>
          <p className="text-sm text-gray-500">Products Wishlisted</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-gray-900">
            {popularProducts.length > 0 ? popularProducts[0]?.wishlistCount || 0 : 0}
          </p>
          <p className="text-sm text-gray-500">Most Wishlisted</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Popular Products */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Most Wishlisted Products</h2>
          {popularProducts.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No wishlist data yet</p>
          ) : (
            <div className="space-y-3">
              {popularProducts.slice(0, 8).map((product: any, index: number) => (
                <Link 
                  key={product?.id || index} 
                  href={`/products/${product?.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition"
                >
                  <span className="text-lg font-bold text-gray-300 w-6">#{index + 1}</span>
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {product?.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">👗</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{product?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">₹{Number(product?.price || 0).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-pink-500">{product?.wishlistCount || 0}</p>
                    <p className="text-xs text-gray-400">wishlists</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Recent Wishlist Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No recent activity</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {recentActivity.map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{item.user?.firstName} {item.user?.lastName}</span>
                      {' '}added to wishlist
                    </p>
                    <p className="text-xs text-gray-500 truncate">{item.product?.name}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Users */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Top Users by Wishlist Count</h2>
          {topUsers.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No user data yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase">Wishlist Items</th>
                </tr>
              </thead>
              <tbody>
                {topUsers.map((user: any) => (
                  <tr key={user.id} className="border-b border-gray-50">
                    <td className="py-3 font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="py-3 text-gray-500">{user.email}</td>
                    <td className="py-3 text-right">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-pink-50 text-pink-600">
                        {user._count.wishlistItems}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
