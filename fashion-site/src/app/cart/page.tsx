'use client';

import { useQuery } from '@tanstack/react-query';
import { cartApi } from '@/lib/api-client';
import Link from 'next/link';

export default function CartPage() {
  const { data: cart, isLoading, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
  });

  const items = cart?.items || [];

  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    try {
      await cartApi.updateItem(itemId, quantity);
      refetch();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await cartApi.removeItem(itemId);
      refetch();
    } catch (err) {
      console.error('Failed to remove:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl">
              <div className="w-24 h-24 skeleton rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 rounded-lg w-1/3" />
                <div className="skeleton h-4 rounded-lg w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
        {items.length > 0 && (
          <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
            {items.length} item{items.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <div className="text-6xl mb-4">🛒</div>
          <p className="text-gray-500 text-lg mb-2">Your cart is empty</p>
          <p className="text-gray-400 text-sm mb-6">Looks like you haven&apos;t added anything yet</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
          >
            Start Shopping
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item: any, idx: number) => (
              <div key={item.id} className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 card-hover animate-fade-in-up" style={{ animationDelay: `${idx * 80}ms` }}>
                <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {item.product?.images?.[0] || item.variant?.images?.[0] ? (
                    <img
                      src={item.variant?.images?.[0] || item.product?.images?.[0]}
                      alt={item.product?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No Image</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{item.product?.name}</h3>
                  {item.variant && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {Object.values(item.variant.attributes || {}).join(', ')}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-indigo-600 mt-1">₹{Number(item.unitPrice).toLocaleString()}</p>

                  <div className="flex items-center gap-2 mt-3">
                    <div className="inline-flex items-center bg-gray-100 rounded-lg overflow-hidden">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition text-sm"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition text-sm"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="ml-auto p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{Number(item.totalPrice).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium">₹{Number(cart?.totalAmount || 0).toLocaleString()}</span>
                </div>
                {cart?.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">-₹{Number(cart.discount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-xl text-gray-900">₹{Number(cart?.totalAmount || 0).toLocaleString()}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all btn-glow"
              >
                Proceed to Checkout
              </Link>
              <Link href="/products" className="block text-center text-sm text-gray-500 mt-3 hover:text-gray-700 transition">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
