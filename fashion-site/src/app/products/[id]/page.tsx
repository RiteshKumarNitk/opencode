'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, cartApi, wishlistApi, reviewsApi } from '@/lib/api-client';
import { useAuthStore, useCompareStore } from '@/lib/stores';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const { isAuthenticated } = useAuthStore();
  const { addItem, removeItem, isInCompare, items: compareItems } = useCompareStore();
  const queryClient = useQueryClient();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  const { data: productRaw, isLoading } = useQuery({
    queryKey: ['product', params.id],
    queryFn: () => productsApi.get(params.id as string),
  });

  const product = productRaw as { 
    id?: string; 
    categoryId?: string;
    images?: string[];
    name?: string;
    price?: number;
    comparePrice?: number;
    description?: string;
    variants?: any[];
    category?: { name?: string };
    brand?: string;
  } | undefined;

  const { data: recommendations } = useQuery({
    queryKey: ['recommendations', product?.categoryId],
    queryFn: async () => {
      if (!product?.categoryId) return [];
      const res = await productsApi.list({ categoryId: product.categoryId, limit: '4' }) as any;
      return (res.data || res).filter((p: any) => p.id !== product?.id);
    },
    enabled: !!product?.categoryId,
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', params.id],
    queryFn: () => reviewsApi.get(params.id as string),
  });

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.get(),
    enabled: isAuthenticated,
  });

  const isInWishlist = Array.isArray(wishlist) && wishlist.some((item: any) => item.productId === params.id);
  const isComparing = isInCompare(product?.id || '');

  const wishlistMutation = useMutation({
    mutationFn: () => isInWishlist ? wishlistApi.remove(params.id as string) : wishlistApi.add(params.id as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
  });

  const compareMutation = useMutation({
    mutationFn: async () => {
      if (isComparing) {
        removeItem(product?.id || '');
      } else {
        addItem(product?.id || '');
      }
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { rating: number; title?: string; comment?: string }) => reviewsApi.create(params.id as string, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', params.id] });
      setShowReviewForm(false);
      setReviewForm({ rating: 5, title: '', comment: '' });
    },
  });

  const handleAddToCart = async () => {
    try {
      await cartApi.addItem({
        productId: product?.id || '',
        variantId: selectedVariant || undefined,
        quantity,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reviewMutation.mutate(reviewForm);
  };

  const handleStockAlert = async () => {
    const email = prompt('Enter your email to get notified when available:');
    if (email) {
      try {
        await fetch('/api/stock-alert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product?.id || '', email }),
        });
        alert('We\'ll notify you when this is back in stock!');
      } catch {
        alert('Failed to set alert');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse grid md:grid-cols-2 gap-10">
          <div className="skeleton aspect-square rounded-2xl" />
          <div className="space-y-4 pt-4">
            <div className="skeleton h-8 rounded-lg w-3/4" />
            <div className="skeleton h-6 rounded-lg w-1/4" />
            <div className="skeleton h-24 rounded-lg" />
            <div className="skeleton h-12 rounded-xl w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-6xl mb-4">😕</div>
        <p className="text-gray-500 text-lg mb-4">Product not found</p>
        <Link href="/products" className="text-indigo-600 font-medium hover:underline">Back to Products</Link>
      </div>
    );
  }

  const images = (product.images?.length || 0) > 0 ? product.images : [];
  const reviewsDataTyped = reviewsData as { reviews?: any[]; averageRating?: number; totalReviews?: number } | undefined;
  const reviews = reviewsDataTyped?.reviews || [];
  const avgRating = reviewsDataTyped?.averageRating || 0;
  const totalReviews = reviewsDataTyped?.totalReviews || 0;
  
  const hasStock = product.variants?.some((v: any) => v.stock > 0) || true;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-8">
        <Link href="/" className="hover:text-gray-600">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-gray-600">Products</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
            {(images || [])[selectedImage] ? (
              <img               src={(images || [])[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {isAuthenticated && (
              <button
                onClick={() => wishlistMutation.mutate()}
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition ${
                  isInWishlist ? 'bg-red-500 text-white' : 'bg-white text-gray-400 hover:text-red-500'
                }`}
              >
                <svg className="w-5 h-5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}
          </div>
          {(images || []).length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {(images || []).slice(0, 5).map((img: string, i: number) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="py-2">
          {product.category && (
            <p className="text-sm text-indigo-600 font-medium mb-2">{product.category.name}</p>
          )}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>

          {/* Rating */}
          {totalReviews > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center">
                {[1,2,3,4,5].map(star => (
                  <svg key={star} className={`w-4 h-4 ${star <= Math.round(avgRating) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-600">{avgRating.toFixed(1)} ({totalReviews} reviews)</span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-gray-900">₹{Number(product.price).toLocaleString()}</span>
            {product.comparePrice && (
              <>
                <span className="text-lg text-gray-400 line-through">₹{Number(product.comparePrice).toLocaleString()}</span>
                <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-lg">
                  {Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)}% OFF
                </span>
              </>
            )}
          </div>

          <div className="prose prose-sm text-gray-600 mb-8 leading-relaxed">
            <p>{product.description}</p>
          </div>

          {/* Variants */}
          {(product.variants?.length || 0) > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Select Option</h3>
              <div className="flex flex-wrap gap-2">
                {(product.variants || []).map((variant: any) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant.id)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedVariant === variant.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : variant.stock === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    disabled={variant.stock === 0}
                  >
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Quantity</h3>
            <div className="inline-flex items-center bg-gray-100 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition text-lg font-medium"
              >
                -
              </button>
              <span className="w-14 text-center font-semibold text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="w-12 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition text-lg font-medium"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <button
            onClick={hasStock ? handleAddToCart : handleStockAlert}
            disabled={added}
            className={`w-full py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
              added
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                : hasStock
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25 btn-glow'
                : 'bg-red-500 text-white'
            }`}
          >
            {added ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Added to Cart!
              </>
            ) : hasStock ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Add to Cart
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notify Me When Available
              </>
            )}
          </button>

          {/* Compare Button */}
          <button
            onClick={() => compareMutation.mutate()}
            className={`w-full py-3 mt-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 border ${
              isComparing
                ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                : 'border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {isComparing ? 'Added to Compare' : 'Add to Compare'}
          </button>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 mt-8">
            {[
              { icon: '🚚', text: 'Free Delivery' },
              { icon: '🔄', text: 'Easy Returns' },
              { icon: '✅', text: 'Quality Assured' },
            ].map((badge) => (
              <div key={badge.text} className="text-center py-3 rounded-xl bg-gray-50">
                <span className="text-lg">{badge.icon}</span>
                <p className="text-xs text-gray-500 mt-1 font-medium">{badge.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
          {isAuthenticated && !showReviewForm && (
            <button onClick={() => setShowReviewForm(true)} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition">
              Write a Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h3 className="font-bold text-gray-900 mb-4">Write Your Review</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(star => (
                    <button key={star} type="button" onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                      className="p-1">
                      <svg className={`w-8 h-8 ${star <= reviewForm.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
                <input type="text" value={reviewForm.title} onChange={e => setReviewForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm" placeholder="Summary of your experience" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Review (optional)</label>
                <textarea value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  rows={4} className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm resize-none" placeholder="Tell others about your experience" />
              </div>
              {reviewMutation.isError && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                  {(reviewMutation.error as any)?.message || 'Failed to submit review'}
                </div>
              )}
              <div className="flex gap-3">
                <button type="submit" disabled={reviewMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold hover:shadow-lg transition disabled:opacity-50">
                  {reviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
                <button type="button" onClick={() => setShowReviewForm(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </form>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-gray-500">No reviews yet. Be the first to review!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                      <span className="text-white text-sm font-bold">{review.user?.firstName?.[0]}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{review.user?.firstName} {review.user?.lastName?.[0]}.</p>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(star => (
                          <svg key={star} className={`w-3 h-3 ${star <= review.rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                {review.title && <h4 className="font-semibold text-gray-900 mb-1">{review.title}</h4>}
                {review.comment && <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      {recommendations && recommendations.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {recommendations.slice(0, 4).map((rec: any) => (
              <Link
                key={rec.id}
                href={`/products/${rec.slug || rec.id}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden card-hover"
              >
                <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
                  {rec.images?.[0] ? (
                    <img src={rec.images[0]} alt={rec.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{rec.name}</h3>
                  <p className="font-bold text-gray-900 mt-1">₹{Number(rec.price).toLocaleString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
