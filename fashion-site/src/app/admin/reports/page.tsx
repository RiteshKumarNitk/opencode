'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';

type ReportType = 'sales' | 'products' | 'customers';

export default function ReportsPage() {
  const [type, setType] = useState<ReportType>('sales');
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data, isLoading } = useQuery({
    queryKey: ['reports', type, startDate, endDate],
    queryFn: () => fetch(`/api/admin/reports?type=${type}&startDate=${startDate}&endDate=${endDate}`).then(r => r.json()).then(data => data || { orders: [], summary: {}, byStatus: {}, daily: {} }),
  });

  const exportToCSV = () => {
    let csv = '';
    if (type === 'sales') {
      csv = 'Order,Date,Customer,Status,Amount,Payment Method\n';
      (data?.orders || []).forEach((o: any) => {
        csv += `${o.orderNumber},${format(new Date(o.createdAt), 'yyyy-MM-dd')},${o.user?.firstName || 'Guest'},${o.status},${o.totalAmount},${o.payment?.method}\n`;
      });
    } else if (type === 'products') {
      csv = 'Product,Quantity Sold,Revenue\n';
      (data || []).forEach((p: any) => { csv += `${p.name},${p.quantity},${p.revenue}\n`; });
    } else {
      csv = 'Name,Email,Orders,Total Spent,Avg Order Value\n';
      (data || []).forEach((c: any) => { csv += `${c.name},${c.email},${c.totalOrders},${c.totalSpent},${(c.avgOrderValue || 0).toFixed(2)}\n`; });
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-report-${startDate}-${endDate}.csv`;
    a.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Exports</h1>
          <p className="text-gray-500 text-sm">Generate and export business reports</p>
        </div>
        <button onClick={exportToCSV} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select value={type} onChange={e => setType(e.target.value as ReportType)} className="px-3 py-2 border border-gray-200 rounded-lg">
              <option value="sales">Sales Report</option>
              <option value="products">Product Performance</option>
              <option value="customers">Customer Report</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />
      ) : (
        <div className="space-y-6">
          {type === 'sales' && data?.summary && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">{data.summary?.totalOrders || 0}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">₹{Number(data.summary?.totalRevenue || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Total Discount</p>
                <p className="text-2xl font-bold">₹{Number(data.summary?.totalDiscount || 0).toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-sm text-gray-500">Total Shipping</p>
                <p className="text-2xl font-bold">₹{Number(data.summary?.totalShipping || 0).toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {type === 'sales' ? 'Orders' : type === 'products' ? 'Top Products' : 'Top Customers'}
              </h2>
            </div>
            {type === 'sales' ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Order</th>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-right px-4 py-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.orders || []).slice(0, 20).map((o: any) => (
                    <tr key={o.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium">{o.orderNumber}</td>
                      <td className="px-4 py-3">{o.user?.firstName || 'Guest'}</td>
                      <td className="px-4 py-3"><span className="px-2 py-1 rounded text-xs bg-gray-100">{o.status}</span></td>
                      <td className="px-4 py-3 text-gray-500">{format(new Date(o.createdAt), 'MMM d')}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{Number(o.totalAmount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : type === 'products' ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Product</th>
                    <th className="text-right px-4 py-3">Qty Sold</th>
                    <th className="text-right px-4 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {(data || []).slice(0, 20).map((p: any, i: number) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-3">{p.name}</td>
                      <td className="px-4 py-3 text-right">{p.quantity}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{Number(p.revenue).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3">Customer</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-right px-4 py-3">Orders</th>
                    <th className="text-right px-4 py-3">Total Spent</th>
                  </tr>
                </thead>
                <tbody>
                  {(data || []).slice(0, 20).map((c: any) => (
                    <tr key={c.id} className="border-t border-gray-100">
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3 text-gray-500">{c.email}</td>
                      <td className="px-4 py-3 text-right">{c.totalOrders}</td>
                      <td className="px-4 py-3 text-right font-medium">₹{Number(c.totalSpent).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}