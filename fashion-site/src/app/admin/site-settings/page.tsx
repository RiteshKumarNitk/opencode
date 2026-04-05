'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SiteSettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState({
    siteName: '', siteEmail: '', sitePhone: '', siteAddress: '',
    logo: '', favicon: '', timezone: 'Asia/Kolkata', currency: 'INR',
    razorpayKeyId: '', razorpayKeySecret: '', stripePublishableKey: '', stripeSecretKey: '',
  });
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({ queryKey: ['settings'], queryFn: () => fetch('/api/admin/settings').then(r => r.json()) });

  const updateMutation = useMutation({
    mutationFn: () => fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); alert('Settings saved!'); },
  });

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'payment', label: 'Payment' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'social', label: 'Social' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
          <p className="text-gray-500 text-sm">Configure your store settings</p>
        </div>
        <button onClick={() => updateMutation.mutate()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Settings</button>
      </div>

      <div className="flex gap-6">
        <div className="w-48 shrink-0">
          <nav className="space-y-1">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 p-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">General Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
                  <input type="text" value={form.siteName} onChange={e => setForm({ ...form, siteName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
                  <input type="email" value={form.siteEmail} onChange={e => setForm({ ...form, siteEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone</label>
                  <input type="tel" value={form.sitePhone} onChange={e => setForm({ ...form, sitePhone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                  <select value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                    <option value="INR">Indian Rupee (₹)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="EUR">Euro (€)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input type="url" value={form.logo} onChange={e => setForm({ ...form, logo: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
            </div>
          )}

          {activeTab === 'payment' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Payment Gateway Settings</h3>
              <div className="space-y-4 border-b border-gray-200 pb-4">
                <h4 className="font-medium text-gray-800">Razorpay</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key ID</label>
                    <input type="text" value={form.razorpayKeyId} onChange={e => setForm({ ...form, razorpayKeyId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Key Secret</label>
                    <input type="password" value={form.razorpayKeySecret} onChange={e => setForm({ ...form, razorpayKeySecret: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Stripe</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Publishable Key</label>
                    <input type="text" value={form.stripePublishableKey} onChange={e => setForm({ ...form, stripePublishableKey: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secret Key</label>
                    <input type="password" value={form.stripeSecretKey} onChange={e => setForm({ ...form, stripeSecretKey: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Shipping Settings</h3>
              <p className="text-gray-500">Configure shipping zones and rates in the Shipping section.</p>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 mb-4">Social Media Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input type="url" placeholder="https://facebook.com/yourstore" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input type="url" placeholder="https://instagram.com/yourstore" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                  <input type="url" placeholder="https://twitter.com/yourstore" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">YouTube</label>
                  <input type="url" placeholder="https://youtube.com/yourstore" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}