'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function SEOPage() {
  const [form, setForm] = useState({
    siteTitle: '', siteDescription: '', siteKeywords: '', ogImage: '',
    googleAnalyticsId: '', googleSearchConsole: '', robotsTxt: '',
  });
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({ queryKey: ['settings', 'seo'], queryFn: () => fetch('/api/admin/settings?category=seo').then(r => r.json()) });

  const updateMutation = useMutation({
    mutationFn: () => fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['settings'] }); alert('SEO settings saved!'); },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SEO Settings</h1>
          <p className="text-gray-500 text-sm">Configure search engine optimization</p>
        </div>
        <button onClick={() => updateMutation.mutate()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save Settings</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Default Meta Tags</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Title</label>
              <input type="text" value={form.siteTitle} onChange={e => setForm({ ...form, siteTitle: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="My Fashion Store" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Keywords</label>
              <input type="text" value={form.siteKeywords} onChange={e => setForm({ ...form, siteKeywords: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="fashion, clothing, online shopping" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Site Description</label>
            <textarea value={form.siteDescription} onChange={e => setForm({ ...form, siteDescription: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" rows={3} placeholder="Your site description for search engines" />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Social Media (Open Graph)</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">OG Image URL</label>
            <input type="url" value={form.ogImage} onChange={e => setForm({ ...form, ogImage: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="https://example.com/og-image.jpg" />
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Google</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Analytics ID</label>
              <input type="text" value={form.googleAnalyticsId} onChange={e => setForm({ ...form, googleAnalyticsId: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="G-XXXXXXXXXX" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Google Search Console</label>
              <input type="text" value={form.googleSearchConsole} onChange={e => setForm({ ...form, googleSearchConsole: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="google-site-verification: XXXXXX" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Robots.txt</h3>
          <textarea value={form.robotsTxt} onChange={e => setForm({ ...form, robotsTxt: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-sm" rows={6} placeholder="User-agent: *&#10;Allow: /&#10;Disallow: /admin" />
        </div>
      </div>
    </div>
  );
}