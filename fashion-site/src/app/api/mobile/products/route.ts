import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const isFeatured = searchParams.get('isFeatured') === 'true';
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const brand = searchParams.get('brand') || undefined;
    const sort = searchParams.get('sort') || 'newest';

    const where: any = { deletedAt: null, isActive: true };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId;
    if (isFeatured) where.isFeatured = true;
    if (brand) where.brand = { equals: brand, mode: 'insensitive' };
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = minPrice;
      if (maxPrice) where.price.lte = maxPrice;
    }

    const sortOrder = sort === 'price_low' ? 'asc' : sort === 'price_high' ? 'desc' : 'desc';
    const sortBy = sort === 'newest' ? { createdAt: sortOrder } : sort === 'price_low' || sort === 'price_high' ? { price: sortOrder } : { createdAt: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: { where: { deletedAt: null, isActive: true }, select: { id: true, name: true, price: true, stock: true, attributes: true, images: true } },
          _count: { select: { reviews: true } },
        },
        orderBy: sortBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const reviews = await prisma.review.groupBy({
      by: ['productId'],
      where: { product: { deletedAt: null } },
      _avg: { rating: true },
      _count: true,
    });

    const reviewMap = reviews.reduce((acc, r) => {
      acc[r.productId] = { avgRating: r._avg.rating || 0, count: r._count };
      return acc;
    }, {} as Record<string, { avgRating: number; count: number }>);

    const data = products.map(p => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      shortDesc: p.shortDesc,
      images: p.images,
      price: p.price,
      comparePrice: p.comparePrice,
      brand: p.brand,
      category: p.category,
      variants: p.variants,
      rating: reviewMap[p.id]?.avgRating || 0,
      reviewCount: reviewMap[p.id]?.count || 0,
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch (error) {
    console.error('Mobile products error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}