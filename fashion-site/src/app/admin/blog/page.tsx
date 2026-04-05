'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

export default function BlogPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [form, setForm] = useState({ title: '', slug: '', content: '', excerpt: '', image: '', author: '', isPublished: false, isFeatured: false, tags: '' });
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({ queryKey: ['blog-posts'], queryFn: () => fetch('/api/admin/blog').then(r => r.json()).then(data => Array.isArray(data) ? data : []) });

  const createMutation = useMutation({
    mutationFn: (data: any) => fetch('/api/admin/blog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, tags: data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blog-posts'] }); setShowModal(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => fetch(`/api/admin/blog?id=${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...data, tags: data.tags.split(',').map((t: string) => t.trim()).filter(Boolean) }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['blog-posts'] }); setShowModal(false); setEditingPost(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/admin/blog?id=${id}`, { method: 'DELETE' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['blog-posts'] }),
  });

  const resetForm = () => setForm({ title: '', slug: '', content: '', excerpt: '', image: '', author: '', isPublished: false, isFeatured: false, tags: '' });

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setForm({ title: post.title, slug: post.slug, content: post.content, excerpt: post.excerpt || '', image: post.image || '', author: post.author || '', isPublished: post.isPublished, isFeatured: post.isFeatured, tags: post.tags?.join(', ') || '' });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPost) updateMutation.mutate({ id: editingPost.id, data: form });
    else createMutation.mutate(form);
  };

  if (isLoading) return <div className="animate-pulse h-96 bg-gray-100 rounded-xl" />;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog / CMS</h1>
          <p className="text-gray-500 text-sm">Manage blog posts and content</p>
        </div>
        <button onClick={() => { resetForm(); setEditingPost(null); setShowModal(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">+ New Post</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(posts || []).map((post: any) => (
          <div key={post.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {post.image && <img src={post.image} alt={post.title} className="w-full h-40 object-cover" />}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2">{post.title}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-3 line-clamp-2">{post.excerpt || 'No excerpt'}</p>
              <div className="flex gap-2 mb-3">
                {post.isPublished && <span className="px-2 py-0.5 text-xs bg-green-50 text-green-600 rounded">Published</span>}
                {post.isFeatured && <span className="px-2 py-0.5 text-xs bg-amber-50 text-amber-600 rounded">Featured</span>}
              </div>
              <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                <span>{post.author || 'Unknown'}</span>
                <span>{format(new Date(post.createdAt), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(post)} className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Edit</button>
                <button onClick={() => deleteMutation.mutate(post.id)} className="flex-1 px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingPost ? 'Edit Post' : 'New Post'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" rows={8} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                  <input type="url" value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Author</label>
                  <input type="text" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="fashion, trends, 2024" className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })} />
                  <span className="text-sm text-gray-700">Published</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={form.isFeatured} onChange={e => setForm({ ...form, isFeatured: e.target.checked })} />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg">{editingPost ? 'Update' : 'Publish'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}