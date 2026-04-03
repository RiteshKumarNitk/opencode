'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ordersApi, paymentsApi } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'razorpay' | 'demo'>('demo');

  const orderId = params.orderId as string;

  const { data: orderRaw, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.get(orderId),
    enabled: isAuthenticated && !!orderId,
  });

  const order = orderRaw as { 
    orderNumber?: string; 
    status?: string;
    totalAmount?: number;
    discount?: number;
    items?: any[];
    address?: { fullName?: string; phone?: string; line1?: string; line2?: string; city?: string; state?: string; postalCode?: string }; 
    payment?: { status?: string };
  } | undefined;

  const initPaymentMutation = useMutation({
    mutationFn: () => paymentsApi.create({ orderId, method: 'RAZORPAY' }),
    onSuccess: (data) => {
      openRazorpay(data);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to initialize payment');
      setProcessing(false);
    },
  });

  const demoPaymentMutation = useMutation({
    mutationFn: () => paymentsApi.demoVerify({ orderId }),
    onSuccess: () => {
      router.push(`/orders/${orderId}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Demo payment failed');
      setProcessing(false);
    },
  });

  const openRazorpay = (paymentData: any) => {
    if (!window.Razorpay) {
      setError('Razorpay SDK not loaded. Please refresh and try again.');
      setProcessing(false);
      return;
    }

    const options = {
      key: paymentData.keyId || 'rzp_test_demo',
      amount: paymentData.amount,
      currency: paymentData.currency,
      name: 'FashionStore',
      description: `Order #${order?.orderNumber}`,
      order_id: paymentData.gatewayOrderId,
      handler: async (response: any) => {
        try {
          await paymentsApi.verify({
            paymentId: paymentData.paymentId,
            method: 'RAZORPAY',
            gatewayPaymentId: response.razorpay_payment_id,
            gatewayOrderId: response.razorpay_order_id,
            signature: response.razorpay_signature,
          });
          router.push(`/orders/${orderId}`);
        } catch {
          setError('Payment verification failed');
          setProcessing(false);
        }
      },
      prefill: {
        name: order?.address?.fullName || '',
        contact: order?.address?.phone || '',
      },
      theme: {
        color: '#6366f1',
      },
      modal: {
        ondismiss: () => {
          setProcessing(false);
          setError('Payment was cancelled');
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handlePayment = () => {
    setError('');
    setProcessing(true);

    if (paymentMode === 'demo') {
      demoPaymentMutation.mutate();
    } else {
      initPaymentMutation.mutate();
    }
  };

  const loadRazorpayScript = () => {
    if (window.Razorpay) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  if (typeof window !== 'undefined' && paymentMode === 'razorpay') {
    loadRazorpayScript();
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <p className="text-gray-500 text-lg mb-4">Please login to continue</p>
        <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition">
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="skeleton h-8 rounded-lg w-1/3" />
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <p className="text-gray-500 text-lg mb-4">Order not found</p>
        <Link href="/orders" className="text-indigo-600 font-medium hover:underline">View Orders</Link>
      </div>
    );
  }

  if (order.status === 'CONFIRMED' || order.payment?.status === 'COMPLETED') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Already Done</h1>
        <p className="text-gray-500 mb-6">This order has already been confirmed.</p>
        <Link
          href={`/orders/${orderId}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition"
        >
          View Order Details
        </Link>
      </div>
    );
  }

  const totalAmount = Number(order.totalAmount);
  const tax = totalAmount * 0.18;
  const grandTotal = totalAmount + tax;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/cart" className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
          <p className="text-sm text-gray-400">Order #{order.orderNumber}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Left: Payment Methods */}
        <div className="lg:col-span-3 space-y-6">
          {/* Payment Mode Selection */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Choose Payment Method</h2>

            <div className="space-y-3">
              {/* Demo Payment */}
              <label
                className={`block p-4 rounded-xl cursor-pointer transition-all border-2 ${
                  paymentMode === 'demo'
                    ? 'border-green-500 bg-green-50/50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value="demo"
                  checked={paymentMode === 'demo'}
                  onChange={() => setPaymentMode('demo')}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    paymentMode === 'demo' ? 'border-green-500' : 'border-gray-300'
                  }`}>
                    {paymentMode === 'demo' && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <span className="text-xl">🎮</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Demo Payment</p>
                    <p className="text-xs text-gray-400">Test mode — no real money charged</p>
                  </div>
                  <span className="px-2 py-1 rounded-lg bg-green-100 text-green-700 text-[10px] font-bold uppercase">
                    Recommended
                  </span>
                </div>
              </label>

              {/* Razorpay */}
              <label
                className={`block p-4 rounded-xl cursor-pointer transition-all border-2 ${
                  paymentMode === 'razorpay'
                    ? 'border-indigo-500 bg-indigo-50/50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMode"
                  value="razorpay"
                  checked={paymentMode === 'razorpay'}
                  onChange={() => setPaymentMode('razorpay')}
                  className="sr-only"
                />
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    paymentMode === 'razorpay' ? 'border-indigo-500' : 'border-gray-300'
                  }`}>
                    {paymentMode === 'razorpay' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Razorpay</p>
                    <p className="text-xs text-gray-400">UPI / Cards / Net Banking / Wallets</p>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Delivery Address */}
          {order.address && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Delivering To</h2>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{order.address.fullName}</p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {order.address.line1}{order.address.line2 && `, ${order.address.line2}`}<br />
                    {order.address.city}, {order.address.state} {order.address.postalCode}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{order.address.phone}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Order Summary + Pay Button */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Order Summary</h2>

            {/* Items */}
            <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0] && (
                      <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">₹{Number(item.totalPrice).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* Amount Breakdown */}
            <div className="border-t border-gray-100 pt-4 space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
              {(order.discount || 0) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-₹{Number(order.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tax (18% GST)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePayment}
              disabled={processing}
              className={`w-full mt-6 py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                paymentMode === 'demo'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-lg hover:shadow-green-500/25'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/25'
              }`}
            >
              {processing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing Payment...
                </span>
              ) : (
                <>
                  {paymentMode === 'demo' ? (
                    <>Complete Demo Payment — ₹{grandTotal.toLocaleString()}</>
                  ) : (
                    <>Pay with Razorpay — ₹{grandTotal.toLocaleString()}</>
                  )}
                </>
              )}
            </button>

            {paymentMode === 'demo' && (
              <p className="text-center text-xs text-gray-400 mt-3">
                No real payment will be processed. This is for testing only.
              </p>
            )}

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 mt-4 text-gray-300">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs">Secure & Encrypted</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
