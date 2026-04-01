'use client';

import Link from 'next/link';
import { useCartStore, useAuthStore } from '@/lib/stores';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function Navbar() {
  const itemCount = useCartStore((state) => state.itemCount);
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 glass border-b border-white/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="text-xl font-bold gradient-text">FashionStore</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            <Link href="/products" className="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all text-sm font-medium">
              Products
            </Link>
            <Link href="/products?category=new" className="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all text-sm font-medium">
              New Arrivals
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/cart"
              className="relative p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center badge-pulse">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center gap-1">
                <Link href="/orders" className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all text-sm font-medium">
                  Orders
                </Link>
                <Link href="/profile" className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all text-sm font-medium flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">{user?.firstName?.[0]}</span>
                  </div>
                  {user?.firstName}
                </Link>
                {user?.role === 'ADMIN' && (
                  <Link href="/admin" className="px-3 py-2 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-all text-sm font-medium">
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login" className="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all text-sm font-medium">
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100/60"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-1 animate-fade-in">
            <Link href="/products" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">Products</Link>
            {isAuthenticated ? (
              <>
                <Link href="/orders" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">My Orders</Link>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">Profile</Link>
                {user?.role === 'ADMIN' && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-indigo-600 hover:bg-indigo-50 text-sm">Dashboard</Link>
                )}
                <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="block w-full text-left px-4 py-2 rounded-lg text-red-500 hover:bg-red-50 text-sm">Logout</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">Sign In</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-indigo-600 hover:bg-indigo-50 text-sm">Get Started</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
