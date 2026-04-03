'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { useState } from 'react';

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'PERCENTAGE', discountValue: '',
    minOrderAmount: '', maxDiscount: '', usageLimit: '', isActive: true,
    startsAt: '', expiresAt: '',
  });
  const [error, setError] = useState('');

  const { data: coupons, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: () => adminApi.coupons.list(),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => adminApi.coupons.create(data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); 
      resetForm(); 
    },
    onError: (err: any) => setError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => adminApi.coupons.update(id, data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }); 
      resetForm(); 
    },
    onError: (err: any) => setError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.coupons.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  const resetForm = () => {
    setForm({ code: '', description: '', discountType: 'PERCENTAGE', discountValue: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', isActive: true, startsAt: '', expiresAt: '' });
    setShowForm(false);
    setEditingId(null);
    setError('');
  };

  const handleEdit = (coupon: any) => {
    setForm({
      code: coupon.code, description: coupon.description || '', discountType: coupon.discountType,
      discountValue: coupon.discountValue?.toString() || '', minOrderAmount: coupon.minOrderAmount?.toString() || '',
      maxDiscount: coupon.maxDiscount?.toString() || '', usageLimit: coupon.usageLimit?.toString() || '',
      isActive: coupon.isActive, startsAt: coupon.startsAt?.split('T')[0] || '', expiresAt: coupon.expiresAt?.split('T')[0] || '',
    });
    setEditingId(coupon.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const data: any = {
      code: form.code, description: form.description || undefined, discountType: form.discountType,
      discountValue: Number(form.discountValue), minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined, usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      isActive: form.isActive, startsAt: form.startsAt || undefined, expiresAt: form.expiresAt || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const couponList = (coupons as any[]) || [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-gray-500 text-sm mt-1">{couponList.length} coupons</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Coupon
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-4">{editingId ? 'Edit Coupon' : 'New Coupon'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">{error}</div>}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input type="text" required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="WELCOME10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white">
                  <option value="PERCENTAGE">Percentage</option>
                  <option value="FIXED">Fixed Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                <input type="number" required value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="10" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Order</label>
                <input type="number" value={form.minOrderAmount} onChange={e => setForm(f => ({ ...f, minOrderAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Discount</label>
                <input type="number" value={form.maxDiscount} onChange={e => setForm(f => ({ ...f, maxDiscount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={e => setForm(f => ({ ...f, usageLimit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input type="date" value={form.startsAt} onChange={e => setForm(f => ({ ...f, startsAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" placeholder="Optional description" />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <div className="flex gap-3">
              <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg transition disabled:opacity-50">
                {(createMutation.isPending || updateMutation.isPending) ? 'Saving...' : editingId ? 'Update' : 'Create'}
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : couponList.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-6xl mb-4">🎟️</p>
          <p className="text-gray-500">No coupons yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Code</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Discount</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Usage</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Expires</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {couponList.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-sm text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{c.code}</span>
                    {c.description && <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                    {c.minOrderAmount && <p className="text-xs text-gray-400">Min: ₹{c.minOrderAmount}</p>}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : 'Never'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${c.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(c)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Edit</button>
                      <button onClick={() => deleteMutation.mutate(c.id)} className="text-red-400 hover:text-red-600 text-sm font-medium">Delete</button>
                    </div>
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
