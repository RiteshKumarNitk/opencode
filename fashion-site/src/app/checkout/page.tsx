'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesApi, ordersApi, cartApi, couponsApi } from '@/lib/api-client';
import { useAuthStore, useCartStore } from '@/lib/stores';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AddressForm from '@/components/AddressForm';

export default function CheckoutPage() {
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('RAZORPAY');
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ email: '', phone: '', firstName: '', lastName: '' });
  const [guestAddress, setGuestAddress] = useState({ line1: '', line2: '', city: '', state: '', postalCode: '' });
  
  const { isAuthenticated } = useAuthStore();
  const cartStore = useCartStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => cartApi.get(),
  });

  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.list(),
    enabled: isAuthenticated,
  });

  const applyCouponMutation = useMutation({
    mutationFn: (code: string) => couponsApi.apply(code),
    onSuccess: () => {
      setCouponApplied(true);
      setCouponMessage('Coupon applied successfully!');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err) => {
      setCouponApplied(false);
      setCouponMessage(err instanceof Error ? err.message : 'Invalid coupon code');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      if (isGuestCheckout || !isAuthenticated) {
        return ordersApi.createGuest({
          email: guestInfo.email,
          phone: guestInfo.phone,
          address: guestAddress,
          items: cartStore.items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          couponCode: couponApplied ? couponCode || undefined : undefined,
        });
      }
      return ordersApi.create({
        addressId: selectedAddress!,
        couponCode: couponApplied ? couponCode || undefined : undefined,
        notes: notes || undefined,
        paymentMethod,
      });
    },
    onSuccess: (order: any) => {
      cartStore.clearCart();
      if (paymentMethod === 'COD' || isGuestCheckout) {
        router.push(`/orders/${order.id}`);
      } else {
        router.push(`/payment/${order.id}`);
      }
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Order creation failed');
    },
  });

  const shouldShowGuestOption = !isAuthenticated && cartStore.items.length > 0;
  const showLoginPrompt = !isAuthenticated && cartStore.items.length === 0;

  if (showLoginPrompt) {
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

  const items = (cart as any)?.items || cartStore.items;
  const addressList = (addresses as any[]) || [];

  if (cartLoading && !isGuestCheckout) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>
        <div className="animate-pulse space-y-4">
          <div className="skeleton h-48 rounded-2xl" />
          <div className="skeleton h-32 rounded-2xl" />
          <div className="skeleton h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0 && !isGuestCheckout) {
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

  const handleAddressFormSuccess = (addressId?: string) => {
    setShowAddressForm(false);
    queryClient.invalidateQueries({ queryKey: ['addresses'] });
    if (addressId) setSelectedAddress(addressId);
  };

  const cartTotal = (cart as any)?.totalAmount || cartStore.totalAmount || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

      {/* Guest Checkout Toggle */}
      {shouldShowGuestOption && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Continue as Guest</p>
              <p className="text-sm text-gray-500">No account required</p>
            </div>
            <button
              onClick={() => setIsGuestCheckout(!isGuestCheckout)}
              className={`w-12 h-6 rounded-full transition-colors ${isGuestCheckout ? 'bg-indigo-600' : 'bg-gray-200'}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transform transition-transform ${isGuestCheckout ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      )}

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
          {/* Contact Info (Guest) */}
          {(isGuestCheckout || !isAuthenticated) && isGuestCheckout && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="First Name"
                  value={guestInfo.firstName}
                  onChange={e => setGuestInfo({...guestInfo, firstName: e.target.value})}
                  className="px-4 py-3 border border-gray-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={guestInfo.lastName}
                  onChange={e => setGuestInfo({...guestInfo, lastName: e.target.value})}
                  className="px-4 py-3 border border-gray-200 rounded-xl"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={guestInfo.email}
                  onChange={e => setGuestInfo({...guestInfo, email: e.target.value})}
                  className="px-4 py-3 border border-gray-200 rounded-xl"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={guestInfo.phone}
                  onChange={e => setGuestInfo({...guestInfo, phone: e.target.value})}
                  className="px-4 py-3 border border-gray-200 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Address Selection */}
          {(isAuthenticated && !isGuestCheckout) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">1</span>
                Delivery Address
              </h2>

              {addressList.length === 0 && !showAddressForm ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <p className="text-gray-500 mb-3">No addresses saved</p>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="text-indigo-600 font-medium text-sm hover:underline"
                  >
                    + Add Address
                  </button>
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
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{addr.fullName}</p>
                            <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">{addr.label || 'Home'}</span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {addr.line1}{addr.line2 && `, ${addr.line2}`}, {addr.city}, {addr.state} {addr.postalCode}
                          </p>
                          <p className="text-sm text-gray-400 mt-0.5">{addr.phone}</p>
                        </div>
                      </div>
                    </label>
                  ))}

                  {showAddressForm ? (
                    <div className="p-4 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/30">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Add New Address</p>
                      <AddressForm
                        onSuccess={() => handleAddressFormSuccess()}
                        onCancel={() => setShowAddressForm(false)}
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition"
                    >
                      + Add New Address
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Guest Address Form */}
          {isGuestCheckout && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">1</span>
                Shipping Address
              </h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Address Line 1"
                  value={guestAddress.line1}
                  onChange={e => setGuestAddress({...guestAddress, line1: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
                <input
                  type="text"
                  placeholder="Address Line 2 (Optional)"
                  value={guestAddress.line2}
                  onChange={e => setGuestAddress({...guestAddress, line2: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl"
                />
                <div className="grid md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="City"
                    value={guestAddress.city}
                    onChange={e => setGuestAddress({...guestAddress, city: e.target.value})}
                    className="px-4 py-3 border border-gray-200 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={guestAddress.state}
                    onChange={e => setGuestAddress({...guestAddress, state: e.target.value})}
                    className="px-4 py-3 border border-gray-200 rounded-xl"
                  />
                  <input
                    type="text"
                    placeholder="PIN Code"
                    value={guestAddress.postalCode}
                    onChange={e => setGuestAddress({...guestAddress, postalCode: e.target.value})}
                    className="px-4 py-3 border border-gray-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">{isGuestCheckout ? 2 : 2}</span>
              Payment Method
            </h2>
            <div className="space-y-3">
              <label className={`block p-4 rounded-xl cursor-pointer transition-all border-2 ${
                paymentMethod === 'RAZORPAY' ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-100 hover:border-gray-200'
              }`}>
                <input type="radio" name="payment" value="RAZORPAY" checked={paymentMethod === 'RAZORPAY'}
                  onChange={() => setPaymentMethod('RAZORPAY')} className="sr-only" />
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    paymentMethod === 'RAZORPAY' ? 'border-indigo-500' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'RAZORPAY' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Pay Online</p>
                    <p className="text-xs text-gray-400">UPI, Cards, Net Banking via Razorpay</p>
                  </div>
                  <span className="text-lg">💳</span>
                </div>
              </label>
              <label className={`block p-4 rounded-xl cursor-pointer transition-all border-2 ${
                paymentMethod === 'COD' ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-100 hover:border-gray-200'
              }`}>
                <input type="radio" name="payment" value="COD" checked={paymentMethod === 'COD'}
                  onChange={() => setPaymentMethod('COD')} className="sr-only" />
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    paymentMethod === 'COD' ? 'border-indigo-500' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'COD' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Cash on Delivery</p>
                    <p className="text-xs text-gray-400">Pay when your order arrives</p>
                  </div>
                  <span className="text-lg">💵</span>
                </div>
              </label>
            </div>
          </div>

          {/* Coupon */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">{isGuestCheckout ? 3 : 3}</span>
              Coupon Code
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon code"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponMessage('');
                  setCouponApplied(false);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
              />
              {couponApplied ? (
                <button
                  onClick={() => {
                    setCouponApplied(false);
                    setCouponCode('');
                    setCouponMessage('');
                    queryClient.invalidateQueries({ queryKey: ['cart'] });
                  }}
                  className="px-5 py-2.5 bg-red-50 text-red-600 rounded-xl font-medium text-sm hover:bg-red-100 transition"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (couponCode.trim()) {
                      applyCouponMutation.mutate(couponCode.trim());
                    }
                  }}
                  disabled={!couponCode.trim() || applyCouponMutation.isPending}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium text-sm hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {applyCouponMutation.isPending ? 'Applying...' : 'Apply'}
                </button>
              )}
            </div>
            {couponMessage && (
              <p className={`text-sm mt-2 ${couponApplied ? 'text-green-600' : 'text-red-500'}`}>
                {couponMessage}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-bold">{isGuestCheckout ? 4 : 4}</span>
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
              {items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate pr-2">
                    {item.product?.name || item.name} <span className="text-gray-400">x{item.quantity}</span>
                  </span>
                  <span className="font-medium flex-shrink-0">₹{Number(item.totalPrice || item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{Number(cartTotal).toLocaleString()}</span>
              </div>
              {((cart as any)?.discount > 0 || couponApplied) && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{Number((cart as any)?.discount || 0).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (18% GST)</span>
                <span>₹{(cartTotal * 0.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{(cartTotal * 1.18).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => createOrderMutation.mutate()}
              disabled={createOrderMutation.isPending || (isAuthenticated && !isGuestCheckout && !selectedAddress && addressList.length > 0)}
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
              ) : paymentMethod === 'COD' || isGuestCheckout ? (
                'Place Order (COD)'
              ) : (
                'Place Order & Pay'
              )}
            </button>

            {isAuthenticated && !isGuestCheckout && !selectedAddress && addressList.length > 0 && (
              <p className="text-center text-sm text-amber-600 mt-3">Please select a delivery address above</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
