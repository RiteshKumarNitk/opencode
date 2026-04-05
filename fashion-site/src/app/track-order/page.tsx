'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [searched, setSearched] = useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['track-order', orderNumber, email],
    queryFn: async () => {
      if (!orderNumber || !email) return null;
      const res = await fetch(`/api/track-order?orderNumber=${orderNumber}&email=${encodeURIComponent(email)}`);
      if (!res.ok) throw new Error('Order not found');
      return res.json();
    },
    enabled: false,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  const statusSteps = [
    { status: 'PENDING', label: 'Order Placed', icon: '📋' },
    { status: 'CONFIRMED', label: 'Confirmed', icon: '✅' },
    { status: 'PROCESSING', label: 'Processing', icon: '📦' },
    { status: 'SHIPPED', label: 'Shipped', icon: '🚚' },
    { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: '🏃' },
    { status: 'DELIVERED', label: 'Delivered', icon: '🎉' },
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.status === order?.status);
  const isDelivered = order?.status === 'DELIVERED';
  const isCancelled = order?.status === 'CANCELLED';

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">Track Your Order</h1>
        
        <form onSubmit={handleSearch} className="bg-white rounded-2xl p-6 shadow-sm mb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Number</label>
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g., ORD-ABC123"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff3f6c] focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#ff3f6c] focus:border-transparent"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            onClick={() => setSearched(true)}
            className="w-full mt-4 px-6 py-3 bg-[#ff3f6c] text-white rounded-lg font-medium hover:bg-red-600"
          >
            Track Order
          </button>
        </form>

        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-[#ff3f6c] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500">Searching for your order...</p>
          </div>
        )}

        {searched && !isLoading && error && (
          <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
            <p className="text-gray-500 text-lg">Order not found</p>
            <p className="text-gray-400 text-sm mt-2">Please check your order number and email address</p>
          </div>
        )}

        {order && !isLoading && (
          <div className="space-y-6">
            {/* Order Info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{order.orderNumber}</h2>
                  <p className="text-gray-500 text-sm">
                    Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                  isDelivered ? 'bg-green-50 text-green-700' :
                  isCancelled ? 'bg-red-50 text-red-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {order.status === 'RETURN_REQUESTED' ? 'Return Requested' : order.status}
                </span>
              </div>
            </div>

            {/* Tracking Progress */}
            {!isCancelled && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Order Status</h3>
                <div className="relative">
                  <div className="absolute top-6 left-6 right-6 h-1 bg-gray-100 hidden md:block">
                    <div 
                      className="h-full bg-gradient-to-r from-[#ff3f6c] to-purple-500 rounded-full"
                      style={{ width: `${Math.max(0, Math.min(100, (currentStepIndex / 5) * 100))}%` }}
                    />
                  </div>
                  <div className="flex flex-col md:flex-row justify-between gap-4 md:gap-0 relative">
                    {statusSteps.map((step, idx) => {
                      const isCompleted = idx <= currentStepIndex;
                      const isCurrent = idx === currentStepIndex;
                      return (
                        <div key={step.status} className="flex md:flex-col items-center gap-3 md:gap-2 text-center">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl z-10 ${
                            isCompleted 
                              ? 'bg-gradient-to-br from-[#ff3f6c] to-purple-600 text-white shadow-lg' 
                              : 'bg-gray-100 text-gray-400'
                          } ${isCurrent ? 'ring-4 ring-pink-100 scale-110' : ''}`}>
                            {step.icon}
                          </div>
                          <div className="md:mt-2">
                            <p className={`text-xs md:text-sm font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                              {step.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Order Items</h3>
              <div className="space-y-4">
                {(order.items || []).map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] && (
                        <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-sm">₹{Number(item.totalPrice).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>₹{Number(order.totalAmount).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            {order.address && (
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Delivery Address</h3>
                <p className="text-gray-600">
                  {order.address.fullName}<br />
                  {order.address.line1}{order.address.line2 && `, ${order.address.line2}`}<br />
                  {order.address.city}, {order.address.state} {order.address.postalCode}<br />
                  {order.address.phone}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}