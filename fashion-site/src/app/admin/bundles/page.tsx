'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';

export default function BundlesPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', image: '', bundlePrice: 0, discount: 0, isActive: true, products: [] as { productId: string; quantity: number }[] });
  const queryClient = useQueryClient();

  const { data: bundles, isLoading } = useQuery({ queryKey: ['bundles'], queryFn: () => fetch('/api/admin/bundles').then(r => r.json().then(data => Array.isArray(data) ? data : [])) });
  const { data: products } = useQuery({ queryKey: ['admin-products'], queryFn: () => adminApi.get('/api/admin/products').then(r => r.data) });

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/bundles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bundles'] }); setShowModal(false); setForm({ name: '', description: '', image: '', bundlePrice: 0, discount: 0, isActive: true, products: [] }); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, data }: any) => fetch(`/api/admin/bundles?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bundles'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/bundles?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bundles'] }),
  });

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Bundles</h1>
          <p className="text-gray-500 text-sm">Create bundled product deals</p>
        </div>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Create Bundle</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(bundles || []).map((bundle: any) => (
          <div key={bundle.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {bundle.image && <img src={bundle.image} alt={bundle.name} className="w-full h-40 object-cover" />}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{bundle.name}</h3>
                <span className={`px-2 py-1 rounded text-xs ${bundle.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{bundle.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{bundle.description || 'No description'}</p>
              <div className="flex justify-between items-center text-sm mb-3">
                <div><span className="font-bold text-indigo-600">₹{Number(bundle.bundlePrice).toLocaleString()}</span> {bundle.discount > 0 && <span className="text-gray-400 line-through">₹{Number(bundle.discount).toLocaleString()}</span>}</div>
                <span className="text-gray-500">{bundle.products?.length || 0} products</span>
              </div>
              {bundle.products?.length > 0 && (
                <div className="text-xs text-gray-500 mb-3">
                  {bundle.products.map((p: any) => p.product?.name).join(', ')}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => toggleMutation.mutate({ id: bundle.id, data: { isActive: !bundle.isActive } })} className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">{bundle.isActive ? 'Disable' : 'Enable'}</button>
                <button onClick={() => deleteMutation.mutate(bundle.id)} className="flex-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create Bundle</h2>
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input type="url" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bundle Price (₹)</label>
                  <input type="number" value={form.bundlePrice} onChange={e => setForm({ ...form, bundlePrice: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Original Price (₹)</label>
                  <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                <label className="text-sm text-gray-700">Active</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Products</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
                  {(products || []).slice(0, 20).map((p: any) => (
                    <label key={p.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded">
                      <input type="checkbox" checked={form.products.some(pr => pr.productId === p.id)} onChange={e => {
                        const products = e.target.checked ? [...form.products, { productId: p.id, quantity: 1 }] : form.products.filter(pr => pr.productId !== p.id);
                        setForm({ ...form, products });
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