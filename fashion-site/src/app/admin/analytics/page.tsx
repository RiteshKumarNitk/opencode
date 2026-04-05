'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays } from 'date-fns';

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const [type, setType] = useState('overview');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', type, days],
    queryFn: () => fetch(`/api/admin/analytics?type=${type}&days=${days}`).then(r => r.json()),
  });

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm">Track your store performance</p>
        </div>
        <select value={days} onChange={e => setDays(parseInt(e.target.value))} className="px-3 py-2 border border-gray-200 rounded-lg">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="flex gap-2 mb-6">
        {['overview', 'pageviews', 'conversion', 'revenue', 'traffic'].map(t => (
          <button key={t} onClick={() => setType(t)} className={`px-4 py-2 rounded-lg text-sm font-medium ${type === t ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {type === 'overview' && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">₹{Number(data.revenue?.total || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400">{data.revenue?.count || 0} orders</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Avg Order Value</p>
              <p className="text-2xl font-bold">₹{Math.round(data.revenue?.avgOrder || 0).toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Conversion Rate</p>
              <p className="text-2xl font-bold">{data.conversion?.cartToCheckout || 0}%</p>
              <p className="text-xs text-gray-400">Cart to checkout</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500">Page Views</p>
              <p className="text-2xl font-bold">{data.pageViews?.length > 0 ? data.pageViews.reduce((s: any, p: any) => s + p.views, 0) : 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
            <div className="flex items-center justify-between gap-4">
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-blue-600">{data.conversion?.cartAdds || 0}</div>
                <p className="text-sm text-gray-500">Add to Cart</p>
              </div>
              <div className="text-gray-300">→</div>
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-purple-600">{data.conversion?.checkouts || 0}</div>
                <p className="text-sm text-gray-500">Checkout</p>
              </div>
              <div className="text-gray-300">→</div>
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-green-600">{data.conversion?.purchases || 0}</div>
                <p className="text-sm text-gray-500">Purchases</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {type === 'revenue' && data?.daily && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Daily Revenue</h3>
          <div className="space-y-2">
            {Object.entries(data.daily).slice(0, 14).reverse().map(([date, amount]: any) => (
              <div key={date} className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{format(new Date(date), 'MMM d')}</span>
                <div className="flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(amount / (data.total || 1)) * 100}%` }} />
                </div>
                <span className="text-sm font-medium">₹{amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {type === 'traffic' && data && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Traffic Sources</h3>
          <div className="space-y-3">
            {(data || []).map((s: any) => (
              <div key={s.source} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{s.source}</span>
                <div className="flex-1 mx-4 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.count}%` }} />
                </div>
                <span className="text-sm font-medium">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}