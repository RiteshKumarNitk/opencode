'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function InventoryPage() {
  const [filter, setFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['inventory', filter, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filter === 'lowStock') params.append('lowStock', 'true');
      if (filter === 'outOfStock') params.append('outOfStock', 'true');
      return fetch(`/api/admin/inventory?${params}`).then(r => r.json()).then(data => data && typeof data === 'object' ? data : {});
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updates: any[]) => fetch('/api/admin/inventory', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates }) }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const handleStockUpdate = (variantId: string, newStock: number) => {
    updateMutation.mutate([{ variantId, stock: newStock }]);
  };

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;

  const categories = Object.keys(data || {});

  if (!data || categories.length === 0) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-500 text-sm">Track and manage product stock</p>
          </div>
        </div>
        <div className="flex gap-2 mb-6">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'lowStock', label: 'Low Stock' },
            { id: 'outOfStock', label: 'Out of Stock' },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400">No inventory data found. Make sure you have products with variants.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-500 text-sm">Track and manage product stock</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { id: 'all', label: 'All Items' },
          { id: 'lowStock', label: 'Low Stock' },
          { id: 'outOfStock', label: 'Out of Stock' },
        ].map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${filter === f.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {categories.map(cat => (
          <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">{cat}</h3>
              <div className="text-sm text-gray-500">
                Total: {data[cat]?.total || 0} | Low: {data[cat]?.lowStock || 0} | Out: {data[cat]?.outOfStock || 0}
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Variant</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Stock</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data[cat]?.variants || []).slice(0, 10).map((v: any) => (
                  <tr key={v.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{v.product?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{v.sku}</td>
                    <td className="px-4 py-3 text-gray-500">{v.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${v.stock === 0 ? 'bg-red-50 text-red-600' : v.stock < 10 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                        {v.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { const newStock = prompt('Enter new stock:', String(v.stock)); if (newStock !== null) handleStockUpdate(v.id, parseInt(newStock)); }} className="text-indigo-600 hover:underline text-sm">
                        Update
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}