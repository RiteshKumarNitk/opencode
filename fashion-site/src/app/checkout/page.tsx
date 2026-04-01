'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { addressesApi, ordersApi, paymentsApi, cartApi } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();

  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
    enabled: isAuthenticated,
  });

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.list(),
    enabled: isAuthenticated,
  });

  const createOrderMutation = useMutation({
    mutationFn: () =>
      ordersApi.create({
        addressId: selectedAddress!,
        couponCode: couponCode || undefined,
        notes: notes || undefined,
        paymentMethod: 'RAZORPAY',
      }),
    onSuccess: async (order) => {
      try {
        await paymentsApi.create({
          orderId: order.id,
          method: 'RAZORPAY',
        });
        router.push(`/orders/${order.id}`);
      } catch (err) {
        setError('Payment initialization failed');
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Order creation failed');
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-gray-500 text-lg mb-4">Please login to checkout</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">
          Sign In
        </Link>
      </div>
    );
  }

  const items = cart?.items || [];
  const addressList = addresses || [];

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
        <Link href="/products" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Address Selection */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">1</span>
              Delivery Address
            </h2>
            {addressList.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-gray-500 mb-3">No addresses saved</p>
                <Link href="/profile" className="text-indigo-600 font-medium text-sm hover:underline">+ Add Address</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {addressList.map((addr: any) => (
                  <label
                    key={addr.id}
                    className={`block p-4 rounded-xl cursor-pointer transition-all border-2 ${
                      selectedAddress === addr.id ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddress === addr.id}
                      onChange={() => setSelectedAddress(addr.id)}
                      className="sr-only"
                    />
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${
                        selectedAddress === addr.id ? 'border-indigo-500' : 'border-gray-300'
                      }`}>
                        {selectedAddress === addr.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{addr.fullName}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {addr.line1}{addr.line2 && `, ${addr.line2}`}, {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        <p className="text-sm text-gray-400 mt-0.5">{addr.phone}</p>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Coupon */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">2</span>
              Coupon Code
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
              />
              <button className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition">
                Apply
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">3</span>
              Order Notes
            </h2>
            <textarea
              placeholder="Any special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl resize-none text-sm"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {items.map((item: any) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate pr-2">
                    {item.product?.name} <span className="text-gray-400">x{item.quantity}</span>
                  </span>
                  <span className="font-medium flex-shrink-0">₹{Number(item.totalPrice).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{Number(cart?.totalAmount || 0).toLocaleString()}</span>
              </div>
              {cart?.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{Number(cart.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (18% GST)</span>
                <span>₹{((cart?.totalAmount || 0) * 0.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{((cart?.totalAmount || 0) * 1.18).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => createOrderMutation.mutate()}
              disabled={!selectedAddress || createOrderMutation.isPending}
              className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed btn-glow"
            >
              {createOrderMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </span>
              ) : (
                'Place Order & Pay'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
