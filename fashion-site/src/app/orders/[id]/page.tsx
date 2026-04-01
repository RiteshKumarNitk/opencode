'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api-client';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function OrderDetailPage() {
  const params = useParams();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', params.id],
    queryFn: () => ordersApi.get(params.id as string),
  });

  const statusConfig: Record<string, { bg: string; text: string; icon: string; step: number }> = {
    PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', icon: '⏳', step: 0 },
    CONFIRMED: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '✅', step: 1 },
    PROCESSING: { bg: 'bg-purple-50', text: 'text-purple-700', icon: '📦', step: 2 },
    SHIPPED: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: '🚚', step: 3 },
    DELIVERED: { bg: 'bg-green-50', text: 'text-green-700', icon: '🎉', step: 4 },
    CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', icon: '❌', step: -1 },
    REFUNDED: { bg: 'bg-gray-50', text: 'text-gray-700', icon: '💰', step: -1 },
  };

  const deliverySteps = [
    { label: 'Order Placed', icon: '📋', desc: 'Your order has been placed' },
    { label: 'Confirmed', icon: '✅', desc: 'Order confirmed by seller' },
    { label: 'Processing', icon: '📦', desc: 'Being prepared for shipping' },
    { label: 'Shipped', icon: '🚚', desc: 'On the way to you' },
    { label: 'Delivered', icon: '🎉', desc: 'Delivered to your address' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="skeleton h-8 rounded-lg w-1/3" />
          <div className="skeleton h-48 rounded-2xl" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="skeleton h-32 rounded-2xl" />
            <div className="skeleton h-32 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <p className="text-gray-500 text-lg mb-4">Order not found</p>
        <Link href="/orders" className="text-indigo-600 font-medium hover:underline">Back to Orders</Link>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.PENDING;
  const currentStep = status.step;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/orders" className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{order.orderNumber}</h1>
          <p className="text-sm text-gray-400">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <span className={`ml-auto px-4 py-2 rounded-xl text-sm font-semibold ${status.bg} ${status.text} flex items-center gap-1.5`}>
          {status.icon} {order.status}
        </span>
      </div>

      {/* Delivery Tracking */}
      {currentStep >= 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Delivery Status</h2>
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-1 bg-gray-100 rounded-full hidden md:block">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              />
            </div>

            {/* Steps */}
            <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-0 relative">
              {deliverySteps.map((step, idx) => {
                const isCompleted = idx <= currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div key={step.label} className="flex md:flex-col items-center gap-3 md:gap-2 text-center">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl z-10 transition-all ${
                      isCompleted
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25'
                        : 'bg-gray-100'
                    } ${isCurrent ? 'ring-4 ring-indigo-100 scale-110' : ''}`}>
                      {step.icon}
                    </div>
                    <div className="md:text-center">
                      <p className={`text-sm font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</p>
                      <p className={`text-xs ${isCompleted ? 'text-gray-500' : 'text-gray-300'}`}>{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Items ({order.items?.length})</h2>
          <div className="space-y-4">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {item.product?.images?.[0] && (
                    <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{item.productName}</p>
                  {item.attributes && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {Object.values(item.attributes).join(', ')}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-sm">₹{Number(item.totalPrice).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          {/* Order Summary */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Summary</h2>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">₹{Number(order.subtotal).toLocaleString()}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-₹{Number(order.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Tax (GST)</span>
                <span className="font-medium">₹{Number(order.tax).toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-100 pt-2.5 flex justify-between font-bold text-base">
                <span>Total</span>
                <span>₹{Number(order.totalAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {order.address && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Delivery Address</h2>
              <div className="flex items-start gap-3">
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

          {/* Payment */}
          {order.payment && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Payment</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Method</span>
                  <span className="font-medium">{order.payment.method}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`font-semibold ${order.payment.status === 'COMPLETED' ? 'text-green-600' : 'text-amber-600'}`}>
                    {order.payment.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium">₹{Number(order.payment.amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
