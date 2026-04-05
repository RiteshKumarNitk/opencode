'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()).then(d => d.data || d),
  });

  const { data: featuredData } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => fetch('/api/products?isFeatured=true&limit=16').then(r => r.json()),
  });

  const { data: banners } = useQuery({
    queryKey: ['home-banners'],
    queryFn: () => fetch('/api/banners?position=home').then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const { data: flashSales } = useQuery({
    queryKey: ['flash-sales-active'],
    queryFn: () => fetch('/api/flash-sales-active').then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const featured = featuredData?.data || featuredData || [];
  const cats = categories || [];

  const [currentBanner, setCurrentBanner] = useState(0);

  useEffect(() => {
    if (banners && banners.length > 1) {
      const timer = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [banners]);

  const categoryImages = [
    { name: 'Men', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop', slug: 'men' },
    { name: 'Women', img: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop', slug: 'women' },
    { name: 'Kids', img: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=400&h=500&fit=crop', slug: 'kids' },
    { name: 'Home', img: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=500&fit=crop', slug: 'home' },
    { name: 'Beauty', img: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=500&fit=crop', slug: 'beauty' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Banner */}
      <div className="bg-[#ff3f6c] text-white text-center py-2 text-xs font-medium">
        🎉 Flat ₹200 OFF on first order | Use code FIRST200
      </div>

      {/* Hero Slider */}
      <section className="relative bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {banners && banners.length > 0 ? (
            <div className="relative">
              <Link href={banners[currentBanner]?.link || '/products'}>
                <img 
                  src={banners[currentBanner]?.image || 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&h=400&fit=crop'} 
                  alt={banners[currentBanner]?.title || 'Banner'} 
                  className="w-full h-48 md:h-64 object-cover rounded-xl cursor-pointer"
                />
              </Link>
              {banners.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentBanner(i)}
                      className={`w-2 h-2 rounded-full ${i === currentBanner ? 'bg-[#ff3f6c]' : 'bg-white/70'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link href="/products">
              <img 
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1400&h=400&fit=crop" 
                alt="Banner" 
                className="w-full h-48 md:h-64 object-cover rounded-xl cursor-pointer"
              />
            </Link>
          )}
        </div>
      </section>

      {/* Flash Sales Banner */}
      {flashSales && flashSales.length > 0 && (
        <section className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-4">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="font-bold text-lg">Flash Sale Live!</h3>
                <p className="text-sm opacity-90">{flashSales[0].name} - Up to {flashSales[0].discount}% OFF</p>
              </div>
            </div>
            <Link href="/products?flashSale=true" className="px-4 py-2 bg-white text-orange-600 rounded-lg font-medium hover:bg-orange-50">
              Shop Now
            </Link>
          </div>
        </section>
      )}

      {/* Category Cards */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Shop By Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {categoryImages.map((cat) => (
            <Link 
              key={cat.slug} 
              href={`/products?category=${cat.slug}`}
              className="group"
            >
              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={cat.img} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <p className="text-center text-sm font-medium text-gray-800 mt-2 group-hover:text-[#ff3f6c]">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Biggest Deals */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Biggest Deals On Top Brands</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {['Nike', 'Puma', 'Adidas', 'Levis', 'Raymond', 'Van Heusen'].map((brand, i) => (
            <Link 
              key={brand} 
              href={`/products?brand=${brand}`}
              className="bg-gray-100 rounded-lg p-4 hover:shadow-md transition text-center"
            >
              <div className="aspect-square bg-white rounded-lg mb-3 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-300">{brand[0]}</span>
              </div>
              <p className="text-sm font-medium text-gray-800">{brand}</p>
              <p className="text-xs text-green-600 mt-1">Min. 50% Off</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/products?isFeatured=true" className="text-sm text-[#ff3f6c] hover:underline">View All →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {featured.slice(0, 16).map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Banner Section */}
      <section className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/products?category=women" className="relative rounded-lg overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&h=300&fit=crop" 
              alt="Women" 
              className="w-full h-40 object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
              <div className="p-6">
                <p className="text-white text-xs font-medium uppercase">New Arrivals</p>
                <p className="text-white text-xl font-bold mt-1">Women's Fashion</p>
                <p className="text-white/80 text-sm mt-1">Starting at ₹299</p>
              </div>
            </div>
          </Link>
          <Link href="/products?category=men" className="relative rounded-lg overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=700&h=300&fit=crop" 
              alt="Men" 
              className="w-full h-40 object-cover hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
              <div className="p-6">
                <p className="text-white text-xs font-medium uppercase">Summer Collection</p>
                <p className="text-white text-xl font-bold mt-1">Men's Wear</p>
                <p className="text-white/80 text-sm mt-1">Up to 60% Off</p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Explore Top Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {[
            { name: 'T-Shirts', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200&h=200&fit=crop' },
            { name: 'Shirts', img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&h=200&fit=crop' },
            { name: 'Jeans', img: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=200&h=200&fit=crop' },
            { name: 'Sarees', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=200&h=200&fit=crop' },
            { name: 'Kurtas', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=200&h=200&fit=crop' },
            { name: 'Shoes', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200&h=200&fit=crop' },
          ].map((cat) => (
            <Link key={cat.name} href={`/products?search=${cat.name}`} className="group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                <img 
                  src={cat.img} 
                  alt={cat.name} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <p className="text-sm font-medium text-gray-800 mt-2 text-center group-hover:text-[#ff3f6c]">{cat.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-8 bg-gray-50 border-t border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#ff3f6c]/10 flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-[#ff3f6c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Easy Returns</p>
              <p className="text-xs text-gray-500 mt-1">30-day return policy</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#ff3f6c]/10 flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-[#ff3f6c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">100% Secure</p>
              <p className="text-xs text-gray-500 mt-1">Secure checkout</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#ff3f6c]/10 flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-[#ff3f6c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">24/7 Support</p>
              <p className="text-xs text-gray-500 mt-1">Dedicated support</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-[#ff3f6c]/10 flex items-center justify-center mb-2">
                <svg className="w-6 h-6 text-[#ff3f6c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 text-sm">Free Shipping</p>
              <p className="text-xs text-gray-500 mt-1">On orders ₹499+</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#fafbfc] border-t border-gray-200 pt-12 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Online Shopping</h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><Link href="/products" className="hover:text-[#ff3f6c]">Men</Link></li>
                <li><Link href="/products" className="hover:text-[#ff3f6c]">Women</Link></li>
                <li><Link href="/products" className="hover:text-[#ff3f6c]">Kids</Link></li>
                <li><Link href="/products" className="hover:text-[#ff3f6c]">Home & Living</Link></li>
                <li><Link href="/products" className="hover:text-[#ff3f6c]">Beauty</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Customer Policies</h3>
              <ul className="space-y-2 text-xs text-gray-600">
                <li><a href="#" className="hover:text-[#ff3f6c]">Contact Us</a></li>
                <li><a href="#" className="hover:text-[#ff3f6c]">FAQ</a></li>
                <li><a href="#" className="hover:text-[#ff3f6c]">Terms & Conditions</a></li>
                <li><a href="#" className="hover:text-[#ff3f6c]">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[#ff3f6c]">Shipping Policy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Follow Us</h3>
              <div className="flex space-x-3">
                <a href="#" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-[#ff3f6c] hover:text-white transition">
                  <span className="text-sm font-bold">f</span>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-[#ff3f6c] hover:text-white transition">
                  <span className="text-sm font-bold">in</span>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-[#ff3f6c] hover:text-white transition">
                  <span className="text-sm font-bold">X</span>
                </a>
              </div>
            </div>
            <div className="col-span-2 md:col-span-3 lg:col-span-3">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">Registered Office Address</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                FashionStore Internet Private Limited,<br />
                Buildings Alyssa, Begonia & Clove,<br />
                Embassy Tech Village, Outer Ring Road,<br />
                Bengaluru, Karnataka 560103, India
              </p>
              <p className="text-xs text-gray-500 mt-4">
                © 2026 FashionStore. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const discount = product.comparePrice
    ? Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)
    : 0;

  return (
    <Link href={`/products/${product.slug || product.id}`} className="group">
      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 relative">
        {product.images?.[0] ? (
          <img 
            src={product.images[0]} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <span className="text-2xl">👕</span>
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-[#ff3f6c] text-white text-[10px] font-bold rounded">
            {discount}% OFF
          </span>
        )}
      </div>
      <div className="mt-2">
        <p className="text-xs text-gray-500 truncate">{product.brand || 'FashionStore'}</p>
        <p className="text-sm font-medium text-gray-900 truncate mt-0.5 group-hover:text-[#ff3f6c]">{product.name}</p>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-sm font-bold text-gray-900">₹{Number(product.price).toLocaleString()}</span>
          {product.comparePrice && (
            <span className="text-xs text-gray-400 line-through">₹{Number(product.comparePrice).toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}