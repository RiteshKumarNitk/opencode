'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, wishlistApi } from '@/lib/api-client';
import { useAuthStore } from '@/lib/stores';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { useDebounce } from '@/lib/hooks';
import { useSearchParams } from 'next/navigation';

interface FilterState {
  search: string;
  category: string;
  minPrice: number;
  maxPrice: number;
  brand: string;
  size: string;
  color: string;
  sort: string;
  flashSale?: boolean;
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    minPrice: 0,
    maxPrice: 10000,
    brand: '',
    size: '',
    color: '',
    sort: 'newest',
  });
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(filters.search, 500);

  useEffect(() => {
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search') || '';
    const flashSale = searchParams.get('flashSale');
    const sort = searchParams.get('sort') || 'newest';
    
    setFilters(prev => ({
      ...prev,
      category: category || prev.category,
      brand: brand || prev.brand,
      search: search || prev.search,
      sort: sort || prev.sort,
    }));
    
    // Also set flashSale filter
    if (flashSale === 'true' || flashSale === 'false') {
      setFilters(prev => ({ ...prev, flashSale: flashSale === 'true' }));
    }
  }, [searchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', debouncedSearch, page, filters],
    queryFn: () => {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '12',
        sort: filters.sort,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.category) params.categoryId = filters.category;
      if (filters.minPrice > 0) params.minPrice = filters.minPrice.toString();
      if (filters.maxPrice < 10000) params.maxPrice = filters.maxPrice.toString();
      if (filters.brand) params.brand = filters.brand;
      if (filters.size) params.size = filters.size;
      if (filters.color) params.color = filters.color;
      if ((filters as any).flashSale) params.flashSale = 'true';
      return productsApi.list(params);
    },
  });

  const products: any[] = (data as any)?.data || data || [];
  const pagination = (data as any)?.pagination;

  const brands: string[] = useMemo(() => {
    const brandSet = new Set(products.map((p: any) => p.brand).filter(Boolean));
    return Array.from(brandSet);
  }, [products]);

  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colors = ['Red', 'Blue', 'Green', 'Black', 'White', 'Yellow', 'Pink', 'Purple'];

  const updateFilter = (key: keyof FilterState, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: 0,
      maxPrice: 10000,
      brand: '',
      size: '',
      color: '',
      sort: 'newest',
    });
    setPage(1);
  };

  const hasActiveFilters = filters.category || filters.brand || filters.size || 
    filters.color || filters.minPrice > 0 || filters.maxPrice < 10000;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shop</h1>
          <p className="text-gray-500 mt-1">
            {pagination?.total || products.length} products found
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
          </button>
          <div className="relative">
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-indigo-500"
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar Filters */}
        <aside className={`hidden lg:block w-64 flex-shrink-0 ${showFilters ? 'fixed inset-0 z-50 bg-white p-6 overflow-y-auto' : ''}`}>
          {showFilters && (
            <button
              onClick={() => setShowFilters(false)}
              className="lg:hidden absolute top-4 right-4 p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Search</h3>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) => updateFilter('minPrice', Number(e.target.value) || 0)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                />
                <span className="text-gray-400">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice === 10000 ? '' : filters.maxPrice}
                  onChange={(e) => updateFilter('maxPrice', Number(e.target.value) || 10000)}
                  className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm"
                />
              </div>
            </div>

            {brands.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Brand</h3>
                <div className="space-y-2">
                  {brands.map((brand: string) => (
                    <label key={brand} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="brand"
                        checked={filters.brand === brand}
                        onChange={() => updateFilter('brand', filters.brand === brand ? '' : brand)}
                        className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-600">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Size</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => updateFilter('size', filters.size === size ? '' : size)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                      filters.size === size
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Color</h3>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateFilter('color', filters.color === color ? '' : color)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                      filters.color === color
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full py-2.5 text-sm text-indigo-600 font-medium hover:text-indigo-700"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* Products Grid */}
        <div className="flex-1">
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="skeleton aspect-[3/4] rounded-2xl mb-3" />
                  <div className="skeleton h-4 rounded-lg mb-2 w-3/4" />
                  <div className="skeleton h-4 rounded-lg w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">No products found</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 text-indigo-600 font-medium"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5">
                {products.map((product: any, idx: number) => (
                  <ProductCard key={product.id} product={product} index={idx} />
                ))}
              </div>

              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>
                  <span className="text-sm text-gray-500 px-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNext}
                    className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 transition flex items-center gap-1"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, index }: { product: any; index: number }) {
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.get(),
    enabled: isAuthenticated,
  });

  const wishlistItems = Array.isArray(wishlist) ? wishlist : [];
  const isInWishlist = wishlistItems.some((item: any) => item.productId === product.id);

  const wishlistMutation = useMutation({
    mutationFn: () => isInWishlist ? wishlistApi.remove(product.id) : wishlistApi.add(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
  });

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    wishlistMutation.mutate();
  };

  return (
    <Link
      href={`/products/${product.slug || product.id}`}
      className="group card-hover rounded-2xl bg-white overflow-hidden border border-gray-100"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="aspect-[3/4] bg-gray-100 overflow-hidden relative">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {product.comparePrice && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-red-500 text-white text-xs font-bold">
            -{Math.round((1 - Number(product.price) / Number(product.comparePrice)) * 100)}%
          </span>
        )}
        <button
          onClick={handleWishlistClick}
          className="absolute top-3 right-3 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition"
        >
          <svg className={`w-4 h-4 ${isInWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      <div className="p-4">
        {product.brand && (
          <p className="text-xs text-gray-400 uppercase tracking-wide">{product.brand}</p>
        )}
        <h3 className="font-semibold text-gray-900 truncate text-sm group-hover:text-indigo-600 transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-bold text-gray-900">₹{Number(product.price).toLocaleString()}</span>
          {product.comparePrice && (
            <span className="text-sm text-gray-400 line-through">₹{Number(product.comparePrice).toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}