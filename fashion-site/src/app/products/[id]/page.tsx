'use client';

import { useQuery } from '@tanstack/react-query';
import { productsApi, cartApi } from '@/lib/api-client';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', params.id],
    queryFn: () => productsApi.get(params.id as string),
  });

  const handleAddToCart = async () => {
    try {
      await cartApi.addItem({
        productId: product.id,
        variantId: selectedVariant || undefined,
        quantity,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
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

  const images = product.images?.length > 0 ? product.images : [];

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
          <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden">
            {images[selectedImage] ? (
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {images.slice(0, 5).map((img: string, i: number) => (
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
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.name}</h1>

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
          {product.variants?.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Select Option</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant: any) => (
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
            onClick={handleAddToCart}
            disabled={added}
            className={`w-full py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
              added
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/25'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/25 btn-glow'
            }`}
          >
            {added ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Added to Cart!
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
                Add to Cart
              </>
            )}
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
    </div>
  );
}
