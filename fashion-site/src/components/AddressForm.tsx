'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addressesApi } from '@/lib/api-client';

interface AddressFormProps {
  initialData?: {
    id: string;
    label?: string;
    fullName: string;
    phone: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    isDefault?: boolean;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AddressForm({ initialData, onSuccess, onCancel }: AddressFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.id;

  const [form, setForm] = useState({
    label: initialData?.label || 'Home',
    fullName: initialData?.fullName || '',
    phone: initialData?.phone || '',
    line1: initialData?.line1 || '',
    line2: initialData?.line2 || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    postalCode: initialData?.postalCode || '',
    country: initialData?.country || 'IN',
    isDefault: initialData?.isDefault || false,
  });

  const [error, setError] = useState('');

  const saveMutation = useMutation({
    mutationFn: (data: typeof form) =>
      isEditing
        ? addressesApi.update(initialData!.id, data)
        : addressesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      onSuccess?.();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to save address');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => addressesApi.delete(initialData!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      onSuccess?.();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Failed to delete address');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim()) { setError('Full name is required'); return; }
    if (!form.phone.trim()) { setError('Phone is required'); return; }
    if (!form.line1.trim()) { setError('Address line 1 is required'); return; }
    if (!form.city.trim()) { setError('City is required'); return; }
    if (!form.state.trim()) { setError('State is required'); return; }
    if (!form.postalCode.trim()) { setError('Postal code is required'); return; }

    saveMutation.mutate(form);
  };

  const inputClass = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Label */}
      <div className="flex gap-2">
        {['Home', 'Work', 'Other'].map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => setForm({ ...form, label })}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              form.label === label
                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                : 'bg-gray-50 text-gray-600 border-2 border-transparent hover:bg-gray-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Full Name *</label>
          <input
            type="text"
            placeholder="John Doe"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Phone *</label>
          <input
            type="tel"
            placeholder="+91 98765 43210"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Address Line 1 *</label>
        <input
          type="text"
          placeholder="House/Flat number, Street name"
          value={form.line1}
          onChange={(e) => setForm({ ...form, line1: e.target.value })}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Address Line 2</label>
        <input
          type="text"
          placeholder="Landmark, Area (optional)"
          value={form.line2}
          onChange={(e) => setForm({ ...form, line2: e.target.value })}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">City *</label>
          <input
            type="text"
            placeholder="Mumbai"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">State *</label>
          <input
            type="text"
            placeholder="Maharashtra"
            value={form.state}
            onChange={(e) => setForm({ ...form, state: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Postal Code *</label>
          <input
            type="text"
            placeholder="400001"
            value={form.postalCode}
            onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
            className={inputClass}
          />
        </div>
      </div>

      {/* Default toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <div
          className={`w-10 h-6 rounded-full relative transition-colors ${
            form.isDefault ? 'bg-indigo-500' : 'bg-gray-200'
          }`}
          onClick={() => setForm({ ...form, isDefault: !form.isDefault })}
        >
          <div
            className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${
              form.isDefault ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </div>
        <span className="text-sm text-gray-600">Set as default address</span>
      </label>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving...' : isEditing ? 'Update Address' : 'Save Address'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-200 transition"
          >
            Cancel
          </button>
        )}
        {isEditing && (
          <button
            type="button"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="ml-auto px-4 py-2.5 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl transition disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        )}
      </div>
    </form>
  );
}
