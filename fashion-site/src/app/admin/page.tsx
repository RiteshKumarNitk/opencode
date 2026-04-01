'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import Link from 'next/link';

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminApi.analytics(),
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-48 bg-gray-200 rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 bg-gray-200 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const o = analytics?.overview || {};
  const recentOrders = analytics?.recentOrders || [];
  const lowStock = analytics?.lowStockVariants || [];

  const stats = [
    { label: 'Total Revenue', value: `₹${Number(o.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50' },
    { label: 'Total Orders', value: o.totalOrders || 0, sub: `${o.pendingOrders || 0} pending`, icon: '📦', color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
    { label: 'Products', value: o.totalProducts || 0, icon: '👗', color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50' },
    { label: 'Customers', value: o.totalCustomers || 0, icon: '👥', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back, {analytics ? 'Admin' : ''}</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center text-lg`}>{s.icon}</div>
              {s.sub && <span className="text-xs text-gray-400">{s.sub}</span>}
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-sm text-indigo-600 font-medium">View All</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm py-8 text-center">No orders yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase">Order</th>
                <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase">Customer</th>
                <th className="text-left py-3 text-xs font-semibold text-gray-400 uppercase">Status</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-400 uppercase">Amount</th>
              </tr></thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-50">
                    <td className="py-3 font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="py-3 text-gray-600">{order.user?.firstName} {order.user?.lastName}</td>
                    <td className="py-3"><span className="px-2.5 py-1 rounded-lg bg-gray-100 text-xs font-semibold">{order.status}</span></td>
                    <td className="py-3 text-right font-semibold">₹{Number(order.totalAmount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Low Stock Alert</h2>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">All items stocked</p>
          ) : (
            <div className="space-y-3">
              {lowStock.map((v: any) => (
                <div key={v.id} className="flex justify-between items-center">
                  <p className="text-sm text-gray-700 truncate max-w-[180px]">{v.product?.name} - {v.name}</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${v.stock < 5 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{v.stock}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
