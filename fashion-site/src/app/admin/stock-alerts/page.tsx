'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import Link from 'next/link';

export default function AdminStockAlertsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stock-alerts'],
    queryFn: () => adminApi.stockAlerts.list(),
  });

  const alerts = (data as any[]) || [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.stockAlerts.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-stock-alerts'] }),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Alerts</h1>
          <p className="text-gray-500 text-sm mt-1">Manage low stock notifications</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-gray-900">{alerts.length}</p>
          <p className="text-sm text-gray-500">Total Alerts</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-gray-900">
            {new Set(alerts.map((a: any) => a.product?.id)).size}
          </p>
          <p className="text-sm text-gray-500">Products with Alerts</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-gray-900">
            {new Set(alerts.map((a: any) => a.email)).size}
          </p>
          <p className="text-sm text-gray-500">Unique Subscribers</p>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : alerts.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No stock alerts</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Variant</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Email</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert: any) => (
                <tr key={alert.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <Link href={`/products/${alert.product?.id}`} className="text-indigo-600 hover:underline font-medium">
                      {alert.product?.name || 'Unknown'}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {alert.variant?.name || '-'}
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {alert.email}
                  </td>
                  <td className="py-4 px-6 text-gray-500">
                    {new Date(alert.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => { if (confirm('Delete this alert?')) deleteMutation.mutate(alert.id); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
