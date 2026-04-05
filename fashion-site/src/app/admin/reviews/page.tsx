'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api-client';
import { useState } from 'react';
import Link from 'next/link';

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews', filter],
    queryFn: () => adminApi.reviews.list({ 
      isActive: filter === 'all' ? '' : filter === 'active' ? 'true' : 'false' 
    }),
  });

  const reviews = (data as any)?.reviews || [];
  const stats = (data as any)?.stats || { avgRating: 0, totalReviews: 0 };

  const filteredReviews = reviews.filter((r: any) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return r.product?.name?.toLowerCase().includes(searchLower) ||
           r.user?.firstName?.toLowerCase().includes(searchLower) ||
           r.comment?.toLowerCase().includes(searchLower);
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      adminApi.reviews.toggle(id, isActive),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.reviews.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customer reviews</p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm w-64"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-5 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
          <p className="text-sm text-gray-500">Total Reviews</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-gray-900">{stats.avgRating.toFixed(1)} / 5</p>
          <p className="text-sm text-gray-500">Average Rating</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-3xl font-bold text-gray-900">{reviews.filter((r: any) => !r.isActive).length}</p>
          <p className="text-sm text-gray-500">Hidden Reviews</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
              filter === f 
                ? 'bg-indigo-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No reviews found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Product</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Review</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Date</th>
                <th className="text-right py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review: any) => (
                <tr key={review.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <Link href={`/products/${review.product?.id}`} className="text-indigo-600 hover:underline font-medium">
                      {review.product?.name || 'Unknown'}
                    </Link>
                  </td>
                  <td className="py-4 px-6 text-gray-600">
                    {review.user?.firstName} {review.user?.lastName}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400' : 'text-gray-200'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600 max-w-xs truncate">
                    {review.title && <p className="font-medium text-gray-900">{review.title}</p>}
                    {review.comment && <p className="text-xs">{review.comment}</p>}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      review.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {review.isActive ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleMutation.mutate({ id: review.id, isActive: !review.isActive })}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                      >
                        {review.isActive ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => { if (confirm('Delete this review?')) deleteMutation.mutate(review.id); }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
