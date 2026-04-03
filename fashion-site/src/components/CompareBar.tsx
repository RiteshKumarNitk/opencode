'use client';

import { useCompareStore } from '@/lib/stores';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api-client';
import Link from 'next/link';

export default function CompareBar() {
  const { items, removeItem, clearAll } = useCompareStore();

  const { data: products } = useQuery({
    queryKey: ['compare-products', items],
    queryFn: async () => {
      if (items.length === 0) return [];
      const results = await Promise.all(items.map(id => productsApi.get(id)));
      return results;
    },
    enabled: items.length > 0,
  });

  if (items.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">
            Compare ({items.length}/4)
          </span>
          
          <div className="flex-1 flex gap-3 overflow-x-auto">
            {products?.map((product: any) => (
              <div
                key={product.id}
                className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200"
              >
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100" />
                )}
                <button
                  onClick={() => removeItem(product.id)}
                  className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={clearAll}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
            <Link
              href="/compare"
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700"
            >
              Compare Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}