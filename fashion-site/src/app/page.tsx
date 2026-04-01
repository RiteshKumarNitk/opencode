'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

export default function HomePage() {
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()).then(d => d.data || d),
  });

  const { data: featuredData } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => fetch('/api/products?isFeatured=true&limit=8').then(r => r.json()),
  });

  const { data: newArrivals } = useQuery({
    queryKey: ['new-products'],
    queryFn: () => fetch('/api/products?limit=8&sortBy=createdAt&sortOrder=desc').then(r => r.json()),
  });

  const featured = featuredData?.data || featuredData || [];
  const newProducts = newArrivals?.data || newArrivals || [];
  const cats = categories || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-gray-900 text-white text-center py-2 text-xs tracking-widest">
        FREE SHIPPING ON ORDERS ABOVE ₹999 | USE CODE: WELCOME10 FOR 10% OFF
      </div>

      {/* Hero Banner */}
      <section className="relative h-[70vh] min-h-[500px] bg-gradient-to-r from-rose-50 via-white to-indigo-50 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-1/2 h-full">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-white/80" />
          </div>
        </div>
        <div className="relative max-w-7xl mx-auto px-6 h-full flex items-center">
          <div className="max-w-xl">
            <p className="text-sm tracking-[0.3em] text-rose-600 font-medium mb-4 uppercase">New Collection 2026</p>
            <h1 className="text-5xl md:text-6xl font-light text-gray-900 leading-tight mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              Timeless<br />
              <span className="font-semibold">Elegance</span>
            </h1>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              Discover handcrafted ethnic wear that celebrates tradition with a modern twist. Premium fabrics, intricate embroidery, and styles that speak to you.
            </p>
            <div className="flex gap-4">
              <Link href="/products" className="px-8 py-3.5 bg-gray-900 text-white text-sm tracking-wider font-medium hover:bg-gray-800 transition">
                SHOP NOW
              </Link>
              <Link href="/products?isFeatured=true" className="px-8 py-3.5 border border-gray-900 text-gray-900 text-sm tracking-wider font-medium hover:bg-gray-900 hover:text-white transition">
                VIEW COLLECTION
              </Link>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute right-20 top-1/2 -translate-y-1/2 hidden lg:block">
          <div className="w-80 h-96 rounded-2xl overflow-hidden shadow-2xl">
            <img src="https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -bottom-10 -left-16 w-48 h-56 rounded-xl overflow-hidden shadow-xl">
            <img src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=300" alt="" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-2">Explore</p>
            <h2 className="text-3xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>Shop by Category</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'Dresses', img: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400', slug: 'dresses' },
              { name: 'Kurtas & Kurtis', img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400', slug: 'kurtas-kurtis' },
              { name: 'Sarees', img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400', slug: 'sarees' },
              { name: 'Ethnic Wear', img: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=400', slug: 'ethnic-wear' },
            ].map((cat) => (
              <Link key={cat.slug} href={`/products?categoryId=${cat.slug}`} className="group">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden relative">
                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <h3 className="text-white text-lg font-medium">{cat.name}</h3>
                    <p className="text-white/70 text-sm mt-1">Shop Now →</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featured.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-2">Curated For You</p>
              <h2 className="text-3xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>Featured Collection</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {featured.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-10">
              <Link href="/products?isFeatured=true" className="px-8 py-3 border border-gray-900 text-gray-900 text-sm tracking-wider font-medium hover:bg-gray-900 hover:text-white transition">
                VIEW ALL
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Banner Strip */}
      <section className="py-16 bg-gradient-to-r from-rose-500 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs tracking-[0.3em] uppercase mb-3 text-white/80">Limited Time Offer</p>
          <h2 className="text-4xl font-light mb-4" style={{ fontFamily: 'Georgia, serif' }}>Flat 20% Off on First Order</h2>
          <p className="text-white/80 mb-6">Use code WELCOME10 at checkout</p>
          <Link href="/products" className="inline-block px-10 py-3.5 bg-white text-gray-900 text-sm tracking-wider font-medium hover:bg-gray-100 transition">
            SHOP THE SALE
          </Link>
        </div>
      </section>

      {/* New Arrivals */}
      {newProducts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs tracking-[0.3em] text-gray-400 uppercase mb-2">Just Dropped</p>
              <h2 className="text-3xl font-light text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>New Arrivals</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {newProducts.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Strip */}
      <section className="py-12 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-8">
            {[
              { icon: '🚚', title: 'Free Shipping', desc: 'On orders above ₹999' },
              { icon: '🔄', title: 'Easy Returns', desc: '30-day return policy' },
              { icon: '🔒', title: 'Secure Payment', desc: '100% secure checkout' },
              { icon: '💬', title: '24/7 Support', desc: 'Dedicated customer care' },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <span className="text-2xl">{item.icon}</span>
                <p className="font-semibold text-gray-900 mt-2 text-sm">{item.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-4 gap-12">
            <div>
              <h3 className="text-white text-lg font-semibold mb-4" style={{ fontFamily: 'Georgia, serif' }}>FashionStore</h3>
              <p className="text-sm leading-relaxed">Premium ethnic wear for the modern woman. Handcrafted with love, delivered with care.</p>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Shop</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/products" className="hover:text-white transition">All Products</Link></li>
                <li><Link href="/products?isFeatured=true" className="hover:text-white transition">Featured</Link></li>
                <li><Link href="/products?category=dresses" className="hover:text-white transition">Dresses</Link></li>
                <li><Link href="/products?category=sarees" className="hover:text-white transition">Sarees</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Help</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Track Order</a></li>
                <li><a href="#" className="hover:text-white transition">Returns</a></li>
                <li><a href="#" className="hover:text-white transition">Shipping Info</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-sm font-semibold mb-4 uppercase tracking-wider">Connect</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition">Pinterest</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-sm text-center">
            &copy; 2026 FashionStore. All rights reserved.
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
      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 relative">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {discount > 0 && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-rose-500 text-white text-xs font-bold rounded">
            {discount}% OFF
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xs font-medium">Quick View</span>
        </div>
      </div>
      <div className="mt-3 px-1">
        {product.category && <p className="text-xs text-gray-400 uppercase tracking-wider">{product.category.name}</p>}
        <h3 className="text-sm font-medium text-gray-900 mt-0.5 truncate group-hover:text-rose-600 transition-colors">{product.name}</h3>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-semibold text-gray-900">₹{Number(product.price).toLocaleString()}</span>
          {product.comparePrice && (
            <span className="text-xs text-gray-400 line-through">₹{Number(product.comparePrice).toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
