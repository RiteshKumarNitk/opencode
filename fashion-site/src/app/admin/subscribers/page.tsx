'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function SubscribersPage() {
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [email, setEmail] = useState('');
  const queryClient = useQueryClient();

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['subscribers', filter],
    queryFn: () => fetch(`/api/admin/subscribers?active=${filter === 'active'}`).then(r => r.json()).then(data => Array.isArray(data) ? data : []),
  });

  const addMutation = useMutation({
    mutationFn: () => fetch('/api/admin/subscribers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['subscribers'] }); setShowModal(false); setEmail(''); },
  });

  const exportCSV = () => {
    const csv = 'Email,Status,Subscribed On\n' + (subscribers || []).map((s: any) => `${s.email},${s.isActive ? 'Active' : 'Inactive'},${s.subscribedAt}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscribers.csv';
    a.click();
  };

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;

  const activeCount = (subscribers || []).filter((s: any) => s.isActive).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Newsletter Subscribers</h1>
          <p className="text-gray-500 text-sm">Manage email subscribers ({activeCount} active)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Export CSV</button>
          <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Add Subscriber</button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'All' },
          { id: 'active', label: 'Active' },
          { id: 'inactive', label: 'Inactive' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Subscribed</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Unsubscribed</th>
            </tr>
          </thead>
          <tbody>
            {(subscribers || []).length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No subscribers found</td></tr>
            ) : (
              (subscribers || []).map((s: any) => (
                <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${s.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{format(new Date(s.subscribedAt), 'MMM d, yyyy')}</td>
                  <td className="px-4 py-3 text-gray-500">{s.unsubscribedAt ? format(new Date(s.unsubscribedAt), 'MMM d, yyyy') : '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Subscriber</h2>
            <form onSubmit={e => { e.preventDefault(); addMutation.mutate(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}