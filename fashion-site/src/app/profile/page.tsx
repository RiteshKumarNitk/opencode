'use client';

import { useQuery } from '@tanstack/react-query';
import { addressesApi, authApi } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores';
import Link from 'next/link';

export default function ProfilePage() {
  const { isAuthenticated } = useAuthStore();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
    enabled: isAuthenticated,
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.list(),
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">👤</div>
        <p className="text-gray-500 text-lg mb-4">Please login to view your profile</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  const addressList = addresses || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* User Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">{user?.firstName?.[0]}{user?.lastName?.[0]}</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm text-gray-600 capitalize">{user?.role?.toLowerCase()}</span>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Saved Addresses</h2>
            <span className="text-sm text-gray-400">{addressList.length} saved</span>
          </div>
          {addressList.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-xl">
              <p className="text-gray-400 text-sm">No addresses saved yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {addressList.map((addr: any) => (
                <div key={addr.id} className="p-4 border border-gray-100 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{addr.fullName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {addr.line1}, {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                    </div>
                    {addr.isDefault && (
                      <span className="px-2 py-0.5 rounded-lg bg-green-50 text-green-600 text-[10px] font-semibold">Default</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/orders', icon: '📦', label: 'My Orders', desc: 'Track & manage' },
          { href: '/cart', icon: '🛒', label: 'Cart', desc: 'View items' },
          { href: '/products', icon: '🛍️', label: 'Shop', desc: 'Browse products' },
          { href: '/', icon: '🏠', label: 'Home', desc: 'Back to home' },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="bg-white border border-gray-100 rounded-2xl p-5 text-center card-hover">
            <span className="text-3xl">{link.icon}</span>
            <p className="font-semibold text-gray-900 mt-2 text-sm">{link.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{link.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
