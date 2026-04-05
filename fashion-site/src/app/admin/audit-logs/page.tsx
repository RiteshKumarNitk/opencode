'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

const actionColors: Record<string, string> = {
  CREATE: 'bg-green-50 text-green-600',
  UPDATE: 'bg-blue-50 text-blue-600',
  DELETE: 'bg-red-50 text-red-600',
  LOGIN: 'bg-purple-50 text-purple-600',
  LOGOUT: 'bg-gray-50 text-gray-600',
  EXPORT: 'bg-amber-50 text-amber-600',
  APPROVE: 'bg-emerald-50 text-emerald-600',
  REJECT: 'bg-rose-50 text-rose-600',
};

export default function AuditLogsPage() {
  const [filters, setFilters] = useState({ userId: '', action: '', entityType: '', startDate: '', endDate: '', page: 1 });

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.action) params.append('action', filters.action);
      if (filters.entityType) params.append('entityType', filters.entityType);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      params.append('page', String(filters.page));
      return fetch(`/api/admin/audit-logs?${params}`).then(r => r.json());
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-gray-500 text-sm">Track all admin activities</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex gap-4 flex-wrap">
          <select value={filters.action} onChange={e => setFilters({ ...filters, action: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
          </select>
          <select value={filters.entityType} onChange={e => setFilters({ ...filters, entityType: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
            <option value="">All Entities</option>
            <option value="product">Product</option>
            <option value="order">Order</option>
            <option value="user">User</option>
            <option value="coupon">Coupon</option>
          </select>
          <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
          <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Timestamp</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Action</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Entity</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody>
              {(data?.logs || []).length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No logs found</td></tr>
              ) : (
                (data?.logs || []).map((log: any) => (
                  <tr key={log.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{format(new Date(log.createdAt), 'MMM d, HH:mm')}</td>
                    <td className="px-4 py-3">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${actionColors[log.action]}`}>{log.action}</span></td>
                    <td className="px-4 py-3">{log.entityType}{log.entityId && <span className="text-gray-400 text-xs"> #{log.entityId.slice(0, 8)}</span>}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{JSON.stringify(log.newValue || log.oldValue || {}).slice(0, 50)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}