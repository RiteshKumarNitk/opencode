'use client';

import { useCompareStore } from '@/lib/stores';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api-client';
import Link from 'next/link';
import { useState } from 'react';

export default function ComparePage() {
  const { items, removeItem, clearAll } = useCompareStore();
  const [notifyEmail, setNotifyEmail] = useState<Record<string, string>>({});

  const { data: products, isLoading } = useQuery({
    queryKey: ['compare-products', items],
    queryFn: async () => {
      if (items.length === 0) return [];
      const results = await Promise.all(items.map(id => productsApi.get(id)));
      return results;
    },
    enabled: items.length > 0,
  });

  const handleStockAlert = async (productId: string) => {
    const email = notifyEmail[productId];
    if (!email) return;

    try {
      await fetch('/api/stock-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email }),
      });
      alert('We\'ll notify you when this product is back in stock!');
      setNotifyEmail((prev) => ({ ...prev, [productId]: '' }));
    } catch {
      alert('Failed to set alert. Please try again.');
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">⚖️</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">No Products to Compare</h1>
        <p className="text-gray-500 mb-6">Add products to compare them side by side</p>
        <Link href="/products" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700">
          Browse Products
        </Link>
      </div>
    );
  }

  const specs = [
    { key: 'price', label: 'Price', getValue: (p: any) => `₹${Number(p.price).toLocaleString()}` },
    { key: 'comparePrice', label: 'Original Price', getValue: (p: any) => p.comparePrice ? `₹${Number(p.comparePrice).toLocaleString()}` : '-' },
    { key: 'category', label: 'Category', getValue: (p: any) => p.category?.name || '-' },
    { key: 'brand', label: 'Brand', getValue: (p: any) => p.brand || '-' },
    { key: 'description', label: 'Description', getValue: (p: any) => p.shortDesc || p.description?.slice(0, 100) + '...' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Compare Products</h1>
        <button onClick={clearAll} className="text-indigo-600 hover:text-indigo-700">
          Clear All
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-full" />
          <div className="h-64 bg-gray-200 rounded w-full" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="text-left p-4 bg-gray-50 w-40"></th>
                {products?.map((product: any) => (
                  <th key={product.id} className="p-4 bg-gray-50 relative">
                    <button
                      onClick={() => removeItem(product.id)}
                      className="absolute top-2 right-2 p-1 hover:bg-gray-200 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <Link href={`/products/${product.slug || product.id}`} className="block">
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                    </Link>
                  </th>
                ))}
                {[...Array(4 - (products?.length || 0))].map((_, i) => (
                  <th key={`empty-${i}`} className="p-4 bg-gray-50">
                    <div className="aspect-square border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                      Add Product
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {specs.map((spec) => (
                <tr key={spec.key} className="border-t border-gray-100">
                  <td className="p-4 font-medium text-gray-600 bg-gray-50">{spec.label}</td>
                  {products?.map((product: any) => (
                    <td key={product.id} className="p-4 text-center">
                      {spec.getValue(product)}
                    </td>
                  ))}
                  {[...Array(4 - (products?.length || 0))].map((_, i) => (
                    <td key={`empty-${i}`} className="p-4 text-center text-gray-300">-</td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-gray-100">
                <td className="p-4 font-medium text-gray-600 bg-gray-50">Availability</td>
                {products?.map((product: any) => {
                  const hasStock = product.variants?.some((v: any) => v.stock > 0) || product.stock > 0;
                  return (
                    <td key={product.id} className="p-4 text-center">
                      {hasStock ? (
                        <span className="text-green-600 font-medium">In Stock</span>
                      ) : (
                        <div className="space-y-2">
                          <span className="text-red-500 font-medium">Out of Stock</span>
                          <div className="flex gap-1">
                            <input
                              type="email"
                              placeholder="Your email"
                              value={notifyEmail[product.id] || ''}
                              onChange={(e) => setNotifyEmail((prev) => ({ ...prev, [product.id]: e.target.value }))}
                              className="w-full px-2 py-1 text-sm border rounded"
                            />
                            <button
                              onClick={() => handleStockAlert(product.id)}
                              className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                              Notify
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  );
                })}
                {[...Array(4 - (products?.length || 0))].map((_, i) => (
                  <td key={`empty-${i}`} className="p-4 text-center text-gray-300">-</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/products" className="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700">
          Add More Products
        </Link>
      </div>
    </div>
  );
}