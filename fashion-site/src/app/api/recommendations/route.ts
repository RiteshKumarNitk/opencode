import { getUserFromRequest } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'personalized';
    const limit = parseInt(searchParams.get('limit') || '10');

    let recommendations: any[] = [];

    if (type === 'trending') {
      const recentProducts = await prisma.orderItem.groupBy({
        by: ['productId'],
        where: { order: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: limit,
      });

      const productIds = recentProducts.map(p => p.productId);
      recommendations = await prisma.product.findMany({
        where: { id: { in: productIds }, deletedAt: null, isActive: true },
        select: { id: true, name: true, slug: true, images: true, price: true, comparePrice: true },
      });
    } 
    else if (type === 'personalized' && user) {
      const viewedProducts = await prisma.productView.findMany({
        where: { userId: user.userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });

      if (viewedProducts.length > 0) {
        const categoryIds = await prisma.product.findMany({
          where: { id: { in: viewedProducts.map(v => v.productId) } },
          select: { categoryId: true },
        });
        const uniqueCategories = [...new Set(categoryIds.map(c => c.categoryId).filter(Boolean))];

        recommendations = await prisma.product.findMany({
          where: { 
            categoryId: { in: uniqueCategories },
            deletedAt: null, 
            isActive: true,
            id: { notIn: viewedProducts.map(v => v.productId) }
          },
          select: { id: true, name: true, slug: true, images: true, price: true, comparePrice: true },
          take: limit,
        });
      }
    }
    else if (type === 'similar' && searchParams.get('productId')) {
      const product = await prisma.product.findUnique({
        where: { id: searchParams.get('productId')! },
        select: { categoryId: true },
      });

      if (product?.categoryId) {
        recommendations = await prisma.product.findMany({
          where: { categoryId: product.categoryId, deletedAt: null, isActive: true },
          select: { id: true, name: true, slug: true, images: true, price: true, comparePrice: true },
          take: limit,
        });
      }
    }
    else if (type === 'bought_together') {
      const productId = searchParams.get('productId');
      if (productId) {
        const orders = await prisma.orderItem.findMany({
          where: { productId },
          select: { orderId: true },
        });
        
        const orderIds = orders.map(o => o.orderId);
        if (orderIds.length > 0) {
          const togetherProducts = await prisma.orderItem.findMany({
            where: { orderId: { in: orderIds }, productId: { not: productId } },
            groupBy: { productId: true },
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: limit,
          });

          const productIds = togetherProducts.map(p => p.productId);
          recommendations = await prisma.product.findMany({
            where: { id: { in: productIds }, deletedAt: null, isActive: true },
            select: { id: true, name: true, slug: true, images: true, price: true, comparePrice: true },
          });
        }
      }
    }

    if (recommendations.length === 0) {
      recommendations = await prisma.product.findMany({
        where: { deletedAt: null, isActive: true, isFeatured: true },
        select: { id: true, name: true, slug: true, images: true, price: true, comparePrice: true },
        take: limit,
      });
    }

    return successResponse(recommendations);
  } catch (error) {
    console.error('Recommendations error:', error);
    return errorResponse('Failed to get recommendations', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const { productId, source, sessionId } = await req.json();

    if (!productId) return errorResponse('Product ID required', 400);

    await prisma.productView.create({
      data: {
        userId: user?.userId,
        sessionId,
        productId,
        source: source || 'direct',
      },
    });

    return successResponse({ success: true });
  } catch (error) {
    return errorResponse('Failed to track view', 500);
  }
}