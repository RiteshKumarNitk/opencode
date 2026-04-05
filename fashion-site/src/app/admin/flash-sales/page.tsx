'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { adminApi } from '@/lib/api-client';

export default function FlashSalesPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', discount: 0, startsAt: '', endsAt: '', isActive: true, productIds: [] as string[] });
  const queryClient = useQueryClient();

  const { data: sales, isLoading } = useQuery({ queryKey: ['flash-sales'], queryFn: () => fetch('/api/admin/flash-sales').then(r => r.json().then(data => Array.isArray(data) ? data : [])) });
  const { data: products } = useQuery({ queryKey: ['admin-products'], queryFn: () => adminApi.get('/api/admin/products').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/flash-sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, startsAt: new Date(data.startsAt), endsAt: new Date(data.endsAt) }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['flash-sales'] }); setShowModal(false); setForm({ name: '', description: '', discount: 0, startsAt: '', endsAt: '', isActive: true, productIds: [] }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, data }: any) => fetch(`/api/admin/flash-sales?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flash-sales'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/flash-sales?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['flash-sales'] }),
  });

  const isActive = (sale: any) => sale.isActive && new Date(sale.startsAt) <= new Date() && new Date(sale.endsAt) >= new Date();

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flash Sales</h1>
          <p className="text-gray-500 text-sm">Create time-limited promotional campaigns</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Create Flash Sale</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(sales || []).map((sale: any) => (
          <div key={sale.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900">{sale.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-medium ${isActive(sale) ? 'bg-green-50 text-green-600' : sale.isActive ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                {isActive(sale) ? 'Live' : sale.isActive ? 'Scheduled' : 'Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3">{sale.description || 'No description'}</p>
            <div className="flex justify-between items-center text-sm mb-4">
              <span className="font-bold text-indigo-600">{sale.discount}% OFF</span>
              <span className="text-gray-500">{sale.products?.length || 0} products</span>
            </div>
            <div className="text-xs text-gray-500 mb-4">
              {format(new Date(sale.startsAt), 'MMM d')} - {format(new Date(sale.endsAt), 'MMM d, yyyy')}
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggleMutation.mutate({ id: sale.id, data: { isActive: !sale.isActive } })} className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
                {sale.isActive ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => deleteMutation.mutate(sale.id)} className="flex-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Flash Sale</h2>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sale Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount %</label>
                  <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Active</label>
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="mt-2" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="datetime-local" value={form.endsAt} onChange={e => setForm({ ...form, endsAt: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Products</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  {(products || []).slice(0, 20).map((p: any) => (
                    <label key={p.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                      <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={e => {
                        const ids = e.target.checked ? [...form.productIds, p.id] : form.productIds.filter(id => id !== p.id);
                        setForm({ ...form, productIds: ids });
                      }} />
                      <span className="text-sm">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}