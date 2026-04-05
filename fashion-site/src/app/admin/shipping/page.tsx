'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function ShippingPage() {
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [form, setForm] = useState({ name: '', countries: '', regions: '', isActive: true });
  const [rateForm, setRateForm] = useState({ name: '', description: '', price: 0, freeShippingThreshold: 0, minWeight: 0, maxWeight: 0, estimatedDays: '', isActive: true });
  const queryClient = useQueryClient();

  const { data: zones, isLoading } = useQuery({ queryKey: ['shipping-zones'], queryFn: () => fetch('/api/admin/shipping').then(r => r.json()).then(data => Array.isArray(data) ? data : []) });

  const createZoneMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/shipping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, countries: data.countries.split(',').map((c: string) => c.trim()) }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shipping-zones'] }); setShowZoneModal(false); setForm({ name: '', countries: '', regions: '', isActive: true }); },
  });

  const updateZoneMutation = useMutation({
    mutationFn: ({ id, data }: any) => fetch(`/api/admin/shipping?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shipping-zones'] }); },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/shipping?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shipping-zones'] }),
  });

  const createRateMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/shipping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, zoneId: selectedZone.id }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['shipping-zones'] }); setShowRateModal(false); },
  });

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Zones</h1>
          <p className="text-gray-500 text-sm">Configure shipping zones and rates</p>
        </div>
        <button onClick={() => setShowZoneModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ Add Zone</button>
      </div>

      <div className="space-y-4">
        {zones?.map((zone: any) => (
          <div key={zone.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{zone.name}</h3>
                <p className="text-sm text-gray-500">{zone.countries?.join(', ') || 'No countries'}</p>
              </div>
              <div className="flex gap-2">
                <span className={`px-2 py-1 rounded text-xs ${zone.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{zone.isActive ? 'Active' : 'Inactive'}</span>
                <button onClick={() => { setSelectedZone(zone); setShowRateModal(true); }} className="px-2 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50">+ Add Rate</button>
                <button onClick={() => deleteZoneMutation.mutate(zone.id)} className="px-2 py-1 text-sm text-red-600 border border-red-200 rounded hover:bg-red-50">Delete</button>
              </div>
            </div>
            {zone.rates?.length > 0 ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Rate Name</th>
                    <th className="text-left px-3 py-2">Price</th>
                    <th className="text-left px-3 py-2">Free Shipping</th>
                    <th className="text-left px-3 py-2">Est. Days</th>
                    <th className="text-left px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {zone.rates.map((rate: any) => (
                    <tr key={rate.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">{rate.name}</td>
                      <td className="px-3 py-2">₹{Number(rate.price).toLocaleString()}</td>
                      <td className="px-3 py-2">{rate.freeShippingThreshold ? `₹${rate.freeShippingThreshold}` : '-'}</td>
                      <td className="px-3 py-2">{rate.estimatedDays || '-'}</td>
                      <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded text-xs ${rate.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100'}`}>{rate.isActive ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-gray-400 text-sm py-2">No rates configured</p>
            )}
          </div>
        ))}
      </div>

      {showZoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Shipping Zone</h2>
            <form onSubmit={e => { e.preventDefault(); createZoneMutation.mutate(form); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zone Name</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Countries (comma separated)</label>
                <input type="text" value={form.countries} onChange={e => setForm({ ...form, countries: e.target.value })} placeholder="IN, US, UK" className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} />
                <label className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowZoneModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRateModal && selectedZone && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Rate to {selectedZone.name}</h2>
            <form onSubmit={e => { e.preventDefault(); createRateMutation.mutate(rateForm); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rate Name</label>
                <input type="text" value={rateForm.name} onChange={e => setRateForm({ ...rateForm, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" value={rateForm.price} onChange={e => setRateForm({ ...rateForm, price: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping (₹)</label>
                  <input type="number" value={rateForm.freeShippingThreshold} onChange={e => setRateForm({ ...rateForm, freeShippingThreshold: parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Delivery</label>
                <input type="text" value={rateForm.estimatedDays} onChange={e => setRateForm({ ...rateForm, estimatedDays: e.target.value })} placeholder="3-5 days" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={rateForm.isActive} onChange={e => setRateForm({ ...rateForm, isActive: e.target.checked })} />
                <label className="text-sm text-gray-700">Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRateModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">Add Rate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}