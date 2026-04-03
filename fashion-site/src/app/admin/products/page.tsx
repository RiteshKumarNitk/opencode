'use client';

import { useQuery } from '@tanstack/react-query';
import { productsApi, adminApi } from '@/lib/api-client';
import { useState } from 'react';
import ProductForm from './ProductForm';

export default function AdminProductsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-products', search],
    queryFn: () => {
      const params: Record<string, string> = { limit: '50' };
      if (search) params.search = search;
      return adminApi.products(params);
    },
  });

  const products = (data as any)?.data || data || [];

  const handleEdit = (id: string) => {
    setEditId(id);
    setShowForm(true);
  };

  const handleNew = () => {
    setEditId(null);
    setShowForm(true);
  };

  const handleSaved = () => {
    setShowForm(false);
    setEditId(null);
    refetch();
  };

  if (showForm) {
    return <ProductForm productId={editId} onSaved={handleSaved} onCancel={() => { setShowForm(false); setEditId(null); }} />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-1">{products.length} products</p>
        </div>
        <button onClick={handleNew} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
          Add Product
        </button>
      </div>

      <div className="mb-6">
        <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <p className="text-6xl mb-4">👗</p>
          <p className="text-gray-500 mb-4">No products yet</p>
          <button onClick={handleNew} className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold">Add First Product</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Product</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Category</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Price</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Stock</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Status</th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-gray-400 uppercase">Actions</th>
            </tr></thead>
            <tbody>
              {products.map((p: any) => {
                const totalStock = p.variants?.reduce((sum: number, v: any) => sum + v.stock, 0) || 0;
                return (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                          {p.images?.[0] ? <img src={p.images[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.variants?.length || 0} variants</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{p.category?.name || '-'}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-sm">₹{Number(p.price).toLocaleString()}</p>
                      {p.comparePrice && <p className="text-xs text-gray-400 line-through">₹{Number(p.comparePrice).toLocaleString()}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${totalStock < 10 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {totalStock}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${p.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.isActive ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleEdit(p.id)} className="text-sm text-indigo-600 font-medium hover:text-indigo-800">Edit</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
