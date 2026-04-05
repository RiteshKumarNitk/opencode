'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface VendorData {
  id: string
  name: string
  slug: string
  description: string
  logo: string
  banner: string
  rating: string
  reviewCount: number
  products: { product: any }[]
  reviews: any[]
}

export default function VendorStorePage() {
  const params = useParams()
  const [vendor, setVendor] = useState<VendorData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.slug) {
      fetch(`/api/vendor/${params.slug}`)
        .then(res => res.json())
        .then(data => {
          setVendor(data)
          setLoading(false)
        })
        .catch(() => setLoading(false))
    }
  }, [params.slug])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Vendor not found</h1>
          <Link href="/" className="text-pink-600 hover:underline mt-4 inline-block">Go Home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative h-48 bg-gradient-to-r from-pink-500 to-purple-600">
        {vendor.banner && (
          <img src={vendor.banner} alt="" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16">
        <div className="bg-white rounded-lg shadow-lg p-6 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            {vendor.logo ? (
              <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-gray-400">{vendor.name[0]}</span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.name}</h1>
            {vendor.description && (
              <p className="text-gray-600 mt-1">{vendor.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center text-yellow-500">
                ★ {vendor.rating} ({vendor.reviewCount} reviews)
              </span>
              <span className="text-gray-500">
                {vendor.products.length} products
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Products</h2>
          
          {vendor.products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {vendor.products.map(({ product }) => (
                <Link key={product.id} href={`/products/${product.id}`} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-pink-600">₹{product.price}</span>
                      {product.comparePrice && (
                        <span className="text-sm text-gray-400 line-through">₹{product.comparePrice}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">No products available</div>
          )}
        </div>

        {vendor.reviews.length > 0 && (
          <div className="mt-12 mb-12">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews</h2>
            <div className="space-y-4">
              {vendor.reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-lg p-6 shadow">
                  <div className="flex items-center gap-2">
                    <div className="flex text-yellow-500">
                      {Array(5).fill(0).map((_, i) => (
                        <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <span className="text-gray-500 text-sm">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {review.title && (
                    <h4 className="font-medium mt-2">{review.title}</h4>
                  )}
                  {review.comment && (
                    <p className="text-gray-600 mt-1">{review.comment}</p>
                  )}
                  <div className="mt-2 text-sm text-gray-500">
                    By {review.user?.firstName} {review.user?.lastName}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}