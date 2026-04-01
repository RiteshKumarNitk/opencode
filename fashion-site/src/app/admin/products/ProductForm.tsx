'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api-client';

interface Variant {
  name: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}

interface ProductFormProps {
  productId: string | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function ProductForm({ productId, onSaved, onCancel }: ProductFormProps) {
  const isEdit = !!productId;

  const { data: existing } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.get(productId!),
    enabled: isEdit,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(r => r.json()).then(d => d.data || d),
  });

  const [form, setForm] = useState({
    name: '',
    description: '',
    shortDesc: '',
    price: '',
    comparePrice: '',
    categoryId: '',
    isActive: true,
    isFeatured: false,
    images: [] as string[],
  });

  const [variants, setVariants] = useState<Variant[]>([
    { name: 'S', sku: '', price: 0, stock: 0, attributes: { size: 'S' } },
    { name: 'M', sku: '', price: 0, stock: 0, attributes: { size: 'M' } },
    { name: 'L', sku: '', price: 0, stock: 0, attributes: { size: 'L' } },
  ]);

  const [imageUrl, setImageUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        description: existing.description || '',
        shortDesc: existing.shortDesc || '',
        price: existing.price?.toString() || '',
        comparePrice: existing.comparePrice?.toString() || '',
        categoryId: existing.categoryId || '',
        isActive: existing.isActive ?? true,
        isFeatured: existing.isFeatured ?? false,
        images: existing.images || [],
      });
      if (existing.variants?.length > 0) {
        setVariants(existing.variants.map((v: any) => ({
          name: v.name, sku: v.sku, price: Number(v.price), stock: v.stock, attributes: v.attributes || {},
        })));
      }
    }
  }, [existing]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i]);
      }

      const token = localStorage.getItem('auth-storage');
      let accessToken = '';
      if (token) {
        try { accessToken = JSON.parse(token).state.accessToken; } catch {}
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const urls = data.data?.urls || data.urls || [];
      setForm(f => ({ ...f, images: [...f.images, ...urls] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addImageUrl = () => {
    if (imageUrl.trim()) {
      setForm(f => ({ ...f, images: [...f.images, imageUrl.trim()] }));
      setImageUrl('');
    }
  };

  const removeImage = (idx: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const updateVariant = (idx: number, field: string, value: any) => {
    setVariants(vs => vs.map((v, i) => i === idx ? { ...v, [field]: value } : v));
  };

  const addVariant = () => {
    setVariants(vs => [...vs, { name: '', sku: '', price: Number(form.price) || 0, stock: 0, attributes: {} }]);
  };

  const removeVariant = (idx: number) => {
    setVariants(vs => vs.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        name: form.name,
        description: form.description,
        shortDesc: form.shortDesc || undefined,
        price: Number(form.price),
        comparePrice: form.comparePrice ? Number(form.comparePrice) : undefined,
        categoryId: form.categoryId || undefined,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        images: form.images,
        variants: variants.map(v => ({
          ...v,
          price: v.price || Number(form.price),
          sku: v.sku || `${form.name.substring(0, 3).toUpperCase()}-${v.name}-${Date.now()}`,
        })),
      };

      if (isEdit) {
        await productsApi.update(productId, payload);
      } else {
        await productsApi.create(payload);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const flatCategories: any[] = [];
  const flattenCats = (cats: any[], prefix = '') => {
    for (const c of cats) {
      flatCategories.push({ ...c, label: prefix + c.name });
      if (c.children) flattenCats(c.children, prefix + '  ');
    }
  };
  if (categories) flattenCats(categories);

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg transition disabled:opacity-50">
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6">{error}</div>}

      <div className="grid grid-cols-3 gap-6">
        {/* Left - Main Info */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Product Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input type="text" required value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="e.g., Floral Print Maxi Dress" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <input type="text" value={form.shortDesc} onChange={(e) => setForm(f => ({ ...f, shortDesc: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="Brief tagline for product cards" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Description *</label>
                <textarea required value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={5} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none"
                  placeholder="Detailed product description including fabric, fit, care instructions..." />
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Product Images</h2>

            {/* File Upload */}
            <div className="mb-4">
              <label className="block w-full border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition">
                <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" />
                {uploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full" />
                    <span className="text-sm text-gray-500">Uploading...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-10 h-10 mx-auto text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-gray-500">Click to upload images</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
                  </>
                )}
              </label>
            </div>

            {/* URL Input */}
            <div className="flex gap-2 mb-4">
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Or paste image URL..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm" />
              <button type="button" onClick={addImageUrl} className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200">Add URL</button>
            </div>

            {/* Image Preview */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-5 gap-3">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </div>
                    <button type="button" onClick={() => removeImage(idx)}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg">×</button>
                    {idx === 0 && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded">Main</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Variants */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-900">Variants (Size/Color)</h2>
              <button type="button" onClick={addVariant} className="text-sm text-indigo-600 font-medium">+ Add Variant</button>
            </div>
            <div className="space-y-3">
              {variants.map((v, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <input type="text" value={v.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)}
                    placeholder="Name (e.g., S, M, Red)" className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <input type="text" value={v.sku} onChange={(e) => updateVariant(idx, 'sku', e.target.value)}
                    placeholder="SKU" className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <input type="number" value={v.price || ''} onChange={(e) => updateVariant(idx, 'price', Number(e.target.value))}
                    placeholder="Price" className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  <input type="number" value={v.stock} onChange={(e) => updateVariant(idx, 'stock', Number(e.target.value))}
                    placeholder="Stock" className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                  {variants.length > 1 && (
                    <button type="button" onClick={() => removeVariant(idx)} className="text-red-400 hover:text-red-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                <input type="number" required value={form.price} onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compare at Price</label>
                <input type="number" value={form.comparePrice} onChange={(e) => setForm(f => ({ ...f, comparePrice: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm" placeholder="Original price (shows strikethrough)" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Organization</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={form.categoryId} onChange={(e) => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white">
                  <option value="">Select category</option>
                  {flatCategories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-bold text-gray-900 mb-4">Status</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                <span className="text-sm text-gray-700">Active (visible on store)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600" />
                <span className="text-sm text-gray-700">Featured product</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
