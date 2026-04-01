'use client';

import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api-client';
import Link from 'next/link';
import { useState } from 'react';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', search, page],
    queryFn: () => {
      const params: Record<string, string> = { page: page.toString(), limit: '12' };
      if (search) params.search = search;
      return productsApi.list(params);
    },
  });

  const products = data?.data || data || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 mt-1">Browse our curated collection</p>
        </div>
        <div className="relative w-full sm:w-80">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 transition-all text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="skeleton aspect-[3/4] rounded-2xl mb-3" />
              <div className="skeleton h-4 rounded-lg mb-2 w-3/4" />
              <div className="skeleton h-4 rounded-lg w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">😕</div>
          <p className="text-gray-500 text-lg">Failed to load products</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-500 text-lg">No products found</p>
          {search && <p className="text-gray-400 text-sm mt-2">Try a different search term</p>}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product: any, idx: number) => (
              <Link
                key={product.id}
                href={`/products/${product.slug || product.id}`}
                className="group card-hover rounded-2xl bg-white overflow-hidden border border-gray-100"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative">
                  {product.images?.[0] ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {product.comparePrice && (
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-bold">
                      -{Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)}%
                    </span>
                  )}
                  {product.isFeatured && (
                    <span className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-indigo-500 text-white text-xs font-bold">
                      Featured
                    </span>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-medium">Quick View</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate text-sm group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h3>
                  {product.category && (
                    <p className="text-xs text-gray-400 mt-0.5">{product.category.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-gray-900">₹{Number(product.price).toLocaleString()}</span>
                    {product.comparePrice && (
                      <span className="text-sm text-gray-400 line-through">₹{Number(product.comparePrice).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-12">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <span className="text-sm text-gray-500 px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1"
              >
                Next
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
