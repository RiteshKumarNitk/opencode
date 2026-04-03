'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi, cartApi } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores';
import Link from 'next/link';
import { useState } from 'react';

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const { data: itemsRaw, isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => wishlistApi.get(),
    enabled: isAuthenticated,
  });

  const items = (itemsRaw as any[]) || [];

  const removeMutation = useMutation({
    mutationFn: (productId: string) => wishlistApi.remove(productId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId);
    try {
      await cartApi.addItem({ productId, quantity: 1 });
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setAddingToCart(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">❤️</div>
        <p className="text-gray-500 text-lg mb-4">Please login to view your items</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} items saved</p>
        </div>
        <Link href="/products" className="text-indigo-600 font-medium text-sm hover:underline">
          Continue Shopping →
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="skeleton aspect-square rounded-2xl mb-3" />
              <div className="skeleton h-4 rounded w-3/4 mb-2" />
              <div className="skeleton h-4 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-6xl mb-4">💝</p>
          <p className="text-gray-500 text-lg mb-2">Your items is empty</p>
          <p className="text-gray-400 text-sm mb-6">Save items you love by clicking the heart icon</p>
          <Link href="/products" className="inline-flex px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg transition-all">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item: any) => {
            const product = item.product;
            if (!product) return null;
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group card-hover">
                <Link href={`/products/${product.id}`}>
                  <div className="aspect-square bg-gray-100 overflow-hidden relative">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">👗</div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/products/${product.id}`}>
                    <h3 className="font-semibold text-gray-900 text-sm truncate mb-1">{product.name}</h3>
                  </Link>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-bold text-gray-900">₹{Number(product.price).toLocaleString()}</span>
                    {product.comparePrice && (
                      <span className="text-xs text-gray-400 line-through">₹{Number(product.comparePrice).toLocaleString()}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddToCart(product.id)}
                      disabled={addingToCart === product.id}
                      className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {addingToCart === product.id ? 'Adding...' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={() => removeMutation.mutate(product.id)}
                      className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
