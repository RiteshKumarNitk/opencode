'use client';

import Link from 'next/link';
import { useCartStore, useAuthStore } from '@/lib/stores';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const megaMenuData: Record<string, {
  label: string;
  categories: { name: string; slug: string; items: string[] }[];
  sizes: string[];
  priceRanges: { label: string; query: string }[];
  featured: { label: string; query: string; icon: string }[];
}> = {
  women: {
    label: 'Women',
    categories: [
      { name: 'Dresses', slug: 'dresses', items: ['Maxi Dresses', 'Wrap Dresses', 'A-Line Dresses', 'Midi Dresses'] },
      { name: 'Kurtas & Kurtis', slug: 'kurtas-kurtis', items: ['Anarkali Kurtas', 'Straight Kurtas', 'A-Line Kurtas', 'Short Kurtis'] },
      { name: 'Sarees', slug: 'sarees', items: ['Silk Sarees', 'Cotton Sarees', 'Designer Sarees', 'Banarasi Sarees'] },
      { name: 'Tops & Tunics', slug: 'tops-tunics', items: ['Casual Tops', 'Formal Tops', 'Crop Tops', 'Tunics'] },
      { name: 'Ethnic Wear', slug: 'ethnic-wear', items: ['Suit Sets', 'Lehenga Cholis', 'Palazzo Sets', 'Sharara Sets'] },
    ],
    sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    priceRanges: [
      { label: 'Under ₹500', query: 'maxPrice=500' },
      { label: '₹500 - ₹1000', query: 'minPrice=500&maxPrice=1000' },
      { label: '₹1000 - ₹2000', query: 'minPrice=1000&maxPrice=2000' },
      { label: '₹2000 - ₹5000', query: 'minPrice=2000&maxPrice=5000' },
      { label: 'Above ₹5000', query: 'minPrice=5000' },
    ],
    featured: [
      { label: 'New Arrivals', query: 'category=women', icon: '✨' },
      { label: 'Best Sellers', query: 'category=women&isFeatured=true', icon: '🔥' },
      { label: 'Sale Items', query: 'category=women', icon: '🏷️' },
    ],
  },
  men: {
    label: 'Men',
    categories: [
      { name: 'Kurtas', slug: 'kurtas', items: ['Casual Kurtas', 'Wedding Kurtas', 'Festive Kurtas', 'Designer Kurtas'] },
      { name: 'Shirts', slug: 'shirts', items: ['Casual Shirts', 'Formal Shirts', 'Linen Shirts', 'Printed Shirts'] },
      { name: 'T-Shirts', slug: 't-shirts', items: ['Polo T-Shirts', 'Round Neck', 'V-Neck', 'Graphic Tees'] },
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL', '3XL'],
    priceRanges: [
      { label: 'Under ₹500', query: 'maxPrice=500' },
      { label: '₹500 - ₹1000', query: 'minPrice=500&maxPrice=1000' },
      { label: '₹1000 - ₹2000', query: 'minPrice=1000&maxPrice=2000' },
      { label: '₹2000 - ₹5000', query: 'minPrice=2000&maxPrice=5000' },
      { label: 'Above ₹5000', query: 'minPrice=5000' },
    ],
    featured: [
      { label: 'New Arrivals', query: 'category=men', icon: '✨' },
      { label: 'Best Sellers', query: 'category=men&isFeatured=true', icon: '🔥' },
      { label: 'Sale Items', query: 'category=men', icon: '🏷️' },
    ],
  },
};

function MegaDropdown({ menuKey, isOpen, onClose }: { menuKey: string; isOpen: boolean; onClose: () => void }) {
  const menu = megaMenuData[menuKey];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || !menu) return null;

  return (
    <div ref={ref} className="absolute top-full left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-xl animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-5 gap-6">
          {/* Categories */}
          {menu.categories.map((cat) => (
            <div key={cat.slug}>
              <Link
                href={`/products?category=${cat.slug}`}
                onClick={onClose}
                className="text-sm font-bold text-gray-900 hover:text-indigo-600 transition block mb-3 pb-2 border-b border-gray-100"
              >
                {cat.name}
              </Link>
              <ul className="space-y-2">
                {cat.items.map((item) => (
                  <li key={item}>
                    <Link
                      href={`/products?category=${cat.slug}`}
                      onClick={onClose}
                      className="text-xs text-gray-500 hover:text-indigo-600 hover:pl-1 transition-all block"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Sizes */}
          <div>
            <p className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Shop by Size</p>
            <div className="flex flex-wrap gap-2">
              {menu.sizes.map((size) => (
                <Link
                  key={size}
                  href={`/products?category=${menuKey}`}
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                >
                  {size}
                </Link>
              ))}
            </div>

            {/* Price Ranges */}
            <p className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100 mt-6">Shop by Price</p>
            <ul className="space-y-2">
              {menu.priceRanges.map((range) => (
                <li key={range.label}>
                  <Link
                    href={`/products?category=${menuKey}&${range.query}`}
                    onClick={onClose}
                    className="text-xs text-gray-500 hover:text-indigo-600 hover:pl-1 transition-all block"
                  >
                    {range.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Featured */}
          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-900 mb-3 pb-2 border-b border-gray-100">Trending</p>
            {menu.featured.map((item) => (
              <Link
                key={item.label}
                href={`/products?${item.query}`}
                onClick={onClose}
                className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-indigo-50 hover:to-purple-50 transition group"
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-600 transition">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Navbar() {
  const itemCount = useCartStore((state) => state.itemCount);
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">F</span>
              </div>
              <span className="text-xl font-bold gradient-text">FashionStore</span>
            </Link>

            {/* Desktop Mega Menu Links */}
            <div className="hidden md:flex items-center space-x-1">
              {Object.entries(megaMenuData).map(([key, menu]) => (
                <button
                  key={key}
                  onMouseEnter={() => setActiveDropdown(key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeDropdown === key
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/60'
                  }`}
                >
                  {menu.label}
                </button>
              ))}
              <Link href="/products" className="px-4 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all text-sm font-medium">
                All Products
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <Link
                href="/products"
                className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all"
                title="Search Products"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Link>

              {/* Cart */}
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
                  <Link href="/dashboard" className="px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100/60 transition-all text-sm font-medium">
                    Dashboard
                  </Link>
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
                      Admin
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
              {/* Mobile mega menu sections */}
              {Object.entries(megaMenuData).map(([key, menu]) => (
                <div key={key}>
                  <button
                    onClick={() => setMobileExpanded(mobileExpanded === key ? null : key)}
                    className="flex items-center justify-between w-full px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-semibold"
                  >
                    {menu.label}
                    <svg className={`w-4 h-4 transition-transform ${mobileExpanded === key ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {mobileExpanded === key && (
                    <div className="pl-4 pb-2 space-y-1">
                      {menu.categories.map((cat) => (
                        <Link
                          key={cat.slug}
                          href={`/products?category=${cat.slug}`}
                          onClick={() => { setMobileOpen(false); setMobileExpanded(null); }}
                          className="block px-4 py-1.5 text-sm text-gray-500 hover:text-indigo-600"
                        >
                          {cat.name}
                        </Link>
                      ))}
                      <div className="px-4 py-2">
                        <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Shop by Size</p>
                        <div className="flex flex-wrap gap-1.5">
                          {menu.sizes.map((size) => (
                            <Link
                              key={size}
                              href={`/products?category=${key}`}
                              onClick={() => { setMobileOpen(false); setMobileExpanded(null); }}
                              className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-[10px] text-gray-500 hover:border-indigo-400 hover:text-indigo-600"
                            >
                              {size}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <Link href="/products" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">All Products</Link>
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">Dashboard</Link>
                  <Link href="/orders" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">My Orders</Link>
                  <Link href="/profile" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 text-sm">Profile</Link>
                  {user?.role === 'ADMIN' && (
                    <Link href="/admin" onClick={() => setMobileOpen(false)} className="block px-4 py-2 rounded-lg text-indigo-600 hover:bg-indigo-50 text-sm">Admin Panel</Link>
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

      {/* Desktop Mega Dropdowns */}
      {Object.keys(megaMenuData).map((key) => (
        <MegaDropdown
          key={key}
          menuKey={key}
          isOpen={activeDropdown === key}
          onClose={() => setActiveDropdown(null)}
        />
      ))}
    </>
  );
}
