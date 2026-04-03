'use client';

import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';

export default function AdminCustomersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: () => adminApi.users({ limit: '50' }),
  });

  const customers = (data as any)?.data || data || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500 text-sm mt-1">{customers.length} registered customers</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : customers.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-6xl mb-4">👥</p>
          <p className="text-gray-500">No customers yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Customer</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Phone</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Orders</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Joined</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
            </tr></thead>
            <tbody>
              {customers.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                        <span className="text-white text-sm font-bold">{c.firstName?.[0]}{c.lastName?.[0]}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{c.firstName} {c.lastName}</p>
                        <p className="text-xs text-gray-400">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{c.phone || '-'}</td>
                  <td className="py-3 px-4 text-sm font-semibold">{c._count?.orders || 0}</td>
                  <td className="py-3 px-4 text-sm text-gray-500">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${c.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                      {c.isActive ? 'Active' : 'Blocked'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
