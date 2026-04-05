import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findFirst({
      where: { OR: [{ id: params.id }, { slug: params.id }], deletedAt: null, isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { deletedAt: null, isActive: true } },
        reviews: { where: { isActive: true }, include: { user: { select: { firstName: true, lastName: true } } }, orderBy: { createdAt: 'desc' }, take: 10 },
        _count: { select: { reviews: true } },
      },
    });

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
    }

    const stats = await prisma.review.aggregate({
      where: { productId: product.id },
      _avg: { rating: true },
      _count: true,
    });

    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, deletedAt: null, isActive: true, id: { not: product.id } },
      take: 10,
      select: { id: true, name: true, slug: true, images: true, price: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        rating: stats._avg.rating || 0,
        reviewCount: stats._count,
        relatedProducts: related,
      },
    });
  } catch (error) {
    console.error('Mobile product detail error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch product' }, { status: 500 });
  }
}