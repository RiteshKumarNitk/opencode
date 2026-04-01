'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500 rounded-full blur-[120px]" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500 rounded-full blur-[150px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-sm mb-8 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              New Collection 2026
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
              Fashion That<br />
              <span className="gradient-text">Defines You</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-xl leading-relaxed animate-fade-in-up" style={{animationDelay: '0.2s'}}>
              Discover curated collections from top designers. Premium quality, fast delivery, and styles that speak to you.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-900 font-semibold hover:bg-gray-100 transition-all shadow-lg shadow-white/10"
              >
                Shop Now
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/products?isFeatured=true"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                View Collection
              </Link>
            </div>
          </div>
        </div>

        {/* Floating elements */}
        <div className="hidden lg:block absolute top-32 right-20 w-64 h-80 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 animate-slide-in" style={{animationDelay: '0.4s'}}>
          <div className="w-full h-40 rounded-lg bg-gradient-to-br from-indigo-400/30 to-purple-500/30 mb-3" />
          <div className="h-3 bg-white/20 rounded w-3/4 mb-2" />
          <div className="h-3 bg-white/10 rounded w-1/2" />
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-12 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Happy Customers', value: '10K+' },
              { label: 'Products', value: '500+' },
              { label: 'Brands', value: '50+' },
              { label: 'Cities', value: '100+' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6 text-center">
                <p className="text-3xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-2">Why Choose Us</p>
            <h2 className="text-4xl font-bold text-gray-900">The FashionStore Experience</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
                title: 'Premium Quality',
                desc: 'Every item is handpicked and quality-checked by our expert fashion team.',
                color: 'from-indigo-500 to-blue-600',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Fast Delivery',
                desc: 'Track your order in real-time. Get it delivered to your doorstep in 3-5 days.',
                color: 'from-purple-500 to-pink-600',
              },
              {
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ),
                title: 'Easy Returns',
                desc: '30-day hassle-free returns. No questions asked, full refund guaranteed.',
                color: 'from-amber-500 to-orange-600',
              },
            ].map((feature) => (
              <div key={feature.title} className="group p-8 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100 transition-all duration-300">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories CTA */}
      <section className="py-24 bg-gradient-to-br from-gray-50 to-indigo-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative rounded-3xl overflow-hidden h-80 group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <p className="text-indigo-200 text-sm font-medium mb-2">Women&apos;s Collection</p>
                <h3 className="text-3xl font-bold text-white mb-4">New Arrivals</h3>
                <Link href="/products" className="self-start px-6 py-2.5 bg-white text-indigo-700 rounded-lg font-semibold text-sm hover:bg-gray-100 transition">
                  Shop Women
                </Link>
              </div>
            </div>
            <div className="relative rounded-3xl overflow-hidden h-80 group">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
              <div className="absolute inset-0 flex flex-col justify-end p-8">
                <p className="text-slate-400 text-sm font-medium mb-2">Men&apos;s Collection</p>
                <h3 className="text-3xl font-bold text-white mb-4">Classic Styles</h3>
                <Link href="/products" className="self-start px-6 py-2.5 bg-white text-slate-900 rounded-lg font-semibold text-sm hover:bg-gray-100 transition">
                  Shop Men
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Delivery Promise */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-2">Delivery Tracking</p>
            <h2 className="text-4xl font-bold text-gray-900">Track Your Order Every Step</h2>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative">
            <div className="hidden md:block absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full" />
            {[
              { step: '1', label: 'Order Placed', icon: '📋' },
              { step: '2', label: 'Confirmed', icon: '✅' },
              { step: '3', label: 'Processing', icon: '📦' },
              { step: '4', label: 'Shipped', icon: '🚚' },
              { step: '5', label: 'Delivered', icon: '🎉' },
            ].map((item) => (
              <div key={item.step} className="relative flex flex-col items-center text-center z-10">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-lg shadow-gray-200/50 flex items-center justify-center text-2xl mb-3 border-2 border-indigo-100">
                  {item.icon}
                </div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-400">Step {item.step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-indigo-600 to-purple-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Start Your Fashion Journey</h2>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
            Join thousands of happy customers. Discover styles that make you feel confident and look amazing.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-white text-indigo-700 font-bold text-lg hover:bg-gray-100 transition-all shadow-lg"
          >
            Create Free Account
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">F</span>
                </div>
                <span className="text-white text-lg font-bold">FashionStore</span>
              </div>
              <p className="text-sm leading-relaxed">Your go-to destination for trendy, premium fashion. Shop with confidence.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Shop</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/products" className="hover:text-white transition">All Products</Link></li>
                <li><Link href="/products?isFeatured=true" className="hover:text-white transition">Featured</Link></li>
                <li><Link href="/products?category=new" className="hover:text-white transition">New Arrivals</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Account</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/login" className="hover:text-white transition">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-white transition">Create Account</Link></li>
                <li><Link href="/orders" className="hover:text-white transition">Track Order</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">Return Policy</a></li>
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
