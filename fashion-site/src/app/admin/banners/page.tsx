'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';

export default function BannersPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [form, setForm] = useState({
    title: '', subtitle: '', image: '', link: '', linkType: '', position: 'home', isActive: true, sortOrder: 0,
  });

  const queryClient = useQueryClient();
  const { data: banners, isLoading } = useQuery({ queryKey: ['banners'], queryFn: () => adminApi.get('/api/admin/banners').then(r => r.data).then(data => Array.isArray(data) ? data : []) });

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['banners'] }); setShowModal(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => fetch(`/api/admin/banners?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['banners'] }); setShowModal(false); setEditingBanner(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['banners'] }),
  });

  const resetForm = () => setForm({ title: '', subtitle: '', image: '', link: '', linkType: '', position: 'home', isActive: true, sortOrder: 0 });

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    setForm({ title: banner.title, subtitle: banner.subtitle || '', image: banner.image, link: banner.link || '', linkType: banner.linkType || '', position: banner.position, isActive: banner.isActive, sortOrder: banner.sortOrder });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) updateMutation.mutate({ id: editingBanner.id, data: form });
    else createMutation.mutate(form);
  };

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
          <p className="text-gray-500 text-sm">Manage homepage and promotional banners</p>
        </div>
        <button onClick={() => { resetForm(); setEditingBanner(null); setShowModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          + Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners?.map((banner: any) => (
          <div key={banner.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <img src={banner.image} alt={banner.title} className="w-full h-40 object-cover" />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{banner.title}</h3>
                <span className={`px-2 py-1 rounded text-xs ${banner.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                  {banner.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{banner.subtitle || 'No subtitle'}</p>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(banner)} className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Edit</button>
                <button onClick={() => deleteMutation.mutate(banner.id)} className="flex-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingBanner ? 'Edit Banner' : 'Add Banner'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                <input type="text" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input type="url" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                  <option value="home">Home</option>
                  <option value="category">Category</option>
                  <option value="product">Product</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link URL</label>
                <input type="url" value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                <label className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  {editingBanner ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}