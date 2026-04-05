'use client';

import Link from 'next/link';
import { useCartStore, useAuthStore } from '@/lib/stores';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

const categories = [
  { name: 'Men', slug: 'men', sub: ['Shirts', 'T-Shirts', 'Jeans', 'Kurtas'] },
  { name: 'Women', slug: 'women', sub: ['Sarees', 'Kurtas', 'Dresses', 'Tops'] },
  { name: 'Kids', slug: 'kids', sub: ['Boys', 'Girls', 'Toys', 'Footwear'] },
  { name: 'Home & Living', slug: 'home', sub: ['Bedsheets', 'Curtains', 'Cushions', 'Carpets'] },
  { name: 'Beauty', slug: 'beauty', sub: ['Makeup', 'Skincare', 'Fragrances', 'Haircare'] },
];

export function Navbar() {
  const itemCount = useCartStore((state) => state.itemCount);
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
    setShowProfileMenu(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center">
            <span className="text-2xl font-bold text-[#ff3f6c]">myntra</span>
          </Link>

          {/* Categories - Desktop */}
          <div className="hidden md:flex items-center space-x-1 ml-8">
            {categories.map((cat) => (
              <div key={cat.slug} className="relative group">
                <button className="px-3 py-2 text-sm font-semibold text-gray-800 hover:text-[#ff3f6c] transition-colors uppercase tracking-wide">
                  {cat.name}
                </button>
                <div className="absolute left-0 top-full hidden group-hover:block bg-white shadow-lg border-t-2 border-[#ff3f6c] min-w-[200px]">
                  <div className="py-2">
                    {cat.sub.map((item) => (
                      <Link
                        key={item}
                        href={`/products?category=${cat.slug}`}
                        className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#ff3f6c]"
                      >
                        {item}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Search for products, brands and more"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff3f6c]/20"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </form>
          </div>

          {/* Right Icons */}
          <div className="flex items-center space-x-1">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="hidden md:flex flex-col items-center p-2 text-gray-600 hover:text-[#ff3f6c]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-[10px] font-medium mt-0.5">Wishlist</span>
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="flex flex-col items-center p-2 text-gray-600 hover:text-[#ff3f6c]"
            >
              <div className="relative">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#ff3f6c] text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium mt-0.5">Bag</span>
            </Link>

            {/* Profile */}
            {isAuthenticated ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex flex-col items-center p-2 text-gray-600 hover:text-[#ff3f6c]"
                >
                  <div className="w-6 h-6 rounded-full bg-[#ff3f6c] flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {user?.firstName?.[0] || 'U'}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium mt-0.5">Profile</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white shadow-lg border rounded-lg min-w-[180px] py-2">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium text-gray-800">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      href="/orders"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Orders
                    </Link>
                    <Link
                      href="/wishlist"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Wishlist
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Profile
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <Link
                        href="/admin"
                        onClick={() => setShowProfileMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Admin Panel
                      </Link>
                    )}
                    {(user?.role === 'VENDOR' || user?.role === 'ADMIN') && (
                      <Link
                        href="/vendor/dashboard"
                        onClick={() => setShowProfileMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                      >
                        Vendor Dashboard
                      </Link>
                    )}
                    <Link
                      href="/become-vendor"
                      onClick={() => setShowProfileMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                    >
                      Become a Vendor
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className="flex flex-col items-center p-2 text-gray-600 hover:text-[#ff3f6c]"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-[10px] font-medium mt-0.5">Profile</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 px-4 py-4 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>

          {categories.map((cat) => (
            <details key={cat.slug} className="group">
              <summary className="flex justify-between items-center py-2 cursor-pointer">
                <span className="font-medium text-gray-800 uppercase">{cat.name}</span>
                <svg className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="pl-4 py-2 space-y-1">
                {cat.sub.map((item) => (
                  <Link
                    key={item}
                    href={`/products?category=${cat.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-1 text-sm text-gray-600"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            </details>
          ))}

          <hr className="border-gray-200" />

          {isAuthenticated ? (
            <div className="space-y-2">
              <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium">My Orders</Link>
              <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium">Wishlist</Link>
              <Link href="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium">Profile</Link>
              {user?.role === 'ADMIN' && (
                <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium">Admin Panel</Link>
              )}
              <button onClick={handleLogout} className="block py-2 font-medium text-red-600">Logout</button>
            </div>
          ) : (
            <div className="space-y-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium">Sign In</Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block py-2 font-medium text-[#ff3f6c]">Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}