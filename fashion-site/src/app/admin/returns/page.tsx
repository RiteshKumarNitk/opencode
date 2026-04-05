'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600',
  APPROVED: 'bg-blue-50 text-blue-600',
  REJECTED: 'bg-red-50 text-red-600',
  RECEIVED: 'bg-purple-50 text-purple-600',
  PROCESSED: 'bg-indigo-50 text-indigo-600',
  COMPLETED: 'bg-green-50 text-green-600',
};

export default function ReturnsPage() {
  const [filter, setFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['returns', filter],
    queryFn: async () => {
      const res = await fetch(`/api/admin/returns?status=${filter}`);
      if (!res.ok) return { requests: [], total: 0 };
      const data = await res.json();
      return data?.requests || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => fetch(`/api/admin/returns?id=${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['returns'] }); setSelectedReturn(null); },
  });

  const handleStatusUpdate = (id: string, status: string) => {
    if (confirm(`Mark this return as ${status}?`)) {
      updateMutation.mutate({ id, data: { status } });
    }
  };

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Returns & Refunds</h1>
          <p className="text-gray-500 text-sm">Manage customer return requests</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {['all', 'PENDING', 'APPROVED', 'REJECTED', 'PROCESSED', 'COMPLETED'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === s ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Return #</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Order</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Reason</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(data || []).length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No return requests found</td></tr>
            ) : (
              (data || []).map((r: any) => (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.returnNumber}</td>
                  <td className="px-4 py-3">{r.order?.orderNumber}</td>
                  <td className="px-4 py-3 max-w-xs truncate">{r.reason}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-gray-500">{format(new Date(r.createdAt), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelectedReturn(r)} className="text-indigo-600 hover:underline">View</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedReturn && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Return {selectedReturn.returnNumber}</h2>
              <button onClick={() => setSelectedReturn(null)} className="text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-sm text-gray-500">Order</p><p className="font-medium">{selectedReturn.order?.orderNumber}</p></div>
                <div><p className="text-sm text-gray-500">Order Amount</p><p className="font-medium">₹{Number(selectedReturn.order?.totalAmount).toLocaleString()}</p></div>
                <div><p className="text-sm text-gray-500">Status</p><span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selectedReturn.status]}`}>{selectedReturn.status}</span></div>
                <div><p className="text-sm text-gray-500">Requested</p><p className="font-medium">{format(new Date(selectedReturn.createdAt), 'MMM d, yyyy HH:mm')}</p></div>
              </div>
              <div><p className="text-sm text-gray-500 mb-1">Reason</p><p className="text-gray-900">{selectedReturn.reason}</p></div>
              {selectedReturn.adminNotes && <div><p className="text-sm text-gray-500 mb-1">Admin Notes</p><p className="text-gray-900">{selectedReturn.adminNotes}</p></div>}
              <div><p className="text-sm text-gray-500 mb-2">Items</p>
                <div className="space-y-2">
                  {selectedReturn.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded-lg">
                      <span>{item.orderItem?.productName}</span>
                      <span className="text-gray-500">Qty: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-4">
                {selectedReturn.status === 'PENDING' && (
                  <>
                    <button onClick={() => handleStatusUpdate(selectedReturn.id, 'APPROVED')} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
                    <button onClick={() => handleStatusUpdate(selectedReturn.id, 'REJECTED')} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Reject</button>
                  </>
                )}
                {selectedReturn.status === 'RECEIVED' && (
                  <button onClick={() => handleStatusUpdate(selectedReturn.id, 'PROCESSED')} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Process Refund</button>
                )}
                {selectedReturn.status === 'PROCESSED' && (
                  <button onClick={() => handleStatusUpdate(selectedReturn.id, 'COMPLETED')} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Complete</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}