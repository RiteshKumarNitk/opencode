'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import Link from 'next/link';
import { useState } from 'react';

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminApi.analytics(),
  });

  const [timeRange, setTimeRange] = useState('30');

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

  const analyticsData = analytics as any;
  const o = analyticsData?.overview || {};
  const recentOrders = analyticsData?.recentOrders || [];
  const lowStock = analyticsData?.lowStockVariants || [];

  const stats = [
    { label: 'Total Revenue', value: `₹${Number(o.totalRevenue || 0).toLocaleString()}`, sub: '+12% from last month', icon: '💰', color: 'from-emerald-500 to-green-600', bg: 'bg-emerald-50' },
    { label: 'Total Orders', value: o.totalOrders || 0, sub: `${o.pendingOrders || 0} pending`, icon: '📦', color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50' },
    { label: 'Products', value: o.totalProducts || 0, sub: 'Active listings', icon: '👗', color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50' },
    { label: 'Customers', value: o.totalCustomers || 0, sub: '+5% new', icon: '👥', color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50' },
  ];

  const salesData = [
    { month: 'Jan', sales: 45000 },
    { month: 'Feb', sales: 52000 },
    { month: 'Mar', sales: 48000 },
    { month: 'Apr', sales: 61000 },
    { month: 'May', sales: 55000 },
    { month: 'Jun', sales: 67000 },
  ];

  const maxSales = Math.max(...salesData.map(d => d.sales));

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center text-lg`}>{s.icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
            {s.sub && <p className="text-xs text-green-600 mt-1">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-gray-900">Sales Overview</h2>
            <div className="flex gap-2">
              {['Sales', 'Orders'].map((tab) => (
                <button key={tab} className={`px-3 py-1 rounded-lg text-xs font-medium ${tab === 'Sales' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {salesData.map((d, i) => (
              <div key={d.month} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-gradient-to-t from-indigo-500 to-purple-400 rounded-t-lg hover:from-indigo-600 hover:to-purple-500 transition-all cursor-pointer"
                  style={{ height: `${(d.sales / maxSales) * 100}%` }}
                />
                <span className="text-xs text-gray-500 mt-2">{d.month}</span>
                <span className="text-[10px] text-gray-400">₹{(d.sales / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-6">Category Sales</h2>
          <div className="space-y-4">
            {[
              { name: 'Women', percent: 45, color: 'bg-pink-500' },
              { name: 'Men', percent: 30, color: 'bg-blue-500' },
              { name: 'Kids', percent: 15, color: 'bg-yellow-500' },
              { name: 'Home', percent: 10, color: 'bg-green-500' },
            ].map((cat) => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{cat.name}</span>
                  <span className="font-medium">{cat.percent}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Orders */}
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
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="py-3 text-gray-600">{order.user?.firstName} {order.user?.lastName}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        order.status === 'DELIVERED' ? 'bg-green-50 text-green-600' :
                        order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-600' :
                        order.status === 'PROCESSING' ? 'bg-purple-50 text-purple-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>{order.status}</span>
                    </td>
                    <td className="py-3 text-right font-semibold">₹{Number(order.totalAmount).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Low Stock */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold text-gray-900 mb-4">Low Stock Alert</h2>
          {lowStock.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">All items stocked</p>
          ) : (
            <div className="space-y-3">
              {lowStock.slice(0, 5).map((v: any) => (
                <div key={v.id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{v.product?.name}</p>
                    <p className="text-xs text-gray-500">{v.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${v.stock < 5 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                    {v.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}