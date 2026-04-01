'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export default function AdminCategoriesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', image: '', parentId: '', isActive: true, sortOrder: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()).then(d => d.data || d),
  });

  const resetForm = () => {
    setForm({ name: '', description: '', image: '', parentId: '', isActive: true, sortOrder: 0 });
    setEditId(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (cat: any) => {
    setForm({
      name: cat.name,
      description: cat.description || '',
      image: cat.image || '',
      parentId: cat.parentId || '',
      isActive: cat.isActive,
      sortOrder: cat.sortOrder,
    });
    setEditId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const accessToken = token?.state?.accessToken;

      const payload = {
        name: form.name,
        description: form.description || undefined,
        image: form.image || undefined,
        parentId: form.parentId || undefined,
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      };

      const url = editId ? `/api/categories/${editId}` : '/api/categories';
      const method = editId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save');
      }

      resetForm();
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      const token = JSON.parse(localStorage.getItem('auth-storage') || '{}');
      const accessToken = token?.state?.accessToken;
      await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` },
      });
      refetch();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const rootCategories = (categories || []).filter((c: any) => !c.parentId);
  const flatCategories: any[] = [];
  const flatten = (cats: any[], prefix = '') => {
    for (const c of cats) {
      flatCategories.push({ ...c, label: prefix + c.name });
      if (c.children?.length) flatten(c.children, prefix + '  ');
    }
  };
  if (categories) flatten(categories);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-500 text-sm mt-1">Organize your product catalog</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Category
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{editId ? 'Edit Category' : 'New Category'}</h2>
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="e.g., Dresses" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input type="url" value={form.image} onChange={(e) => setForm(f => ({ ...f, image: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Category</label>
                <select value={form.parentId} onChange={(e) => setForm(f => ({ ...f, parentId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                  <option value="">None (top-level)</option>
                  {rootCategories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                  <input type="number" value={form.sortOrder} onChange={(e) => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))}
                    className="w-20 px-3 py-2 border border-gray-200 rounded-xl text-sm" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Saving...' : editId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category List */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : flatCategories.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-6xl mb-4">📂</p>
          <p className="text-gray-500 mb-4">No categories yet</p>
          <button onClick={() => setShowForm(true)} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Add First Category</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Category</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Products</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {flatCategories.map((cat: any) => (
                <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                        {cat.image ? <img src={cat.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">📁</div>}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{cat.name}</p>
                        <p className="text-xs text-gray-400">{cat.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">{cat._count?.products || 0}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${cat.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-3">
                    <button onClick={() => handleEdit(cat)} className="text-sm text-indigo-600 font-medium">Edit</button>
                    <button onClick={() => handleDelete(cat.id)} className="text-sm text-red-500 font-medium">Delete</button>
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
