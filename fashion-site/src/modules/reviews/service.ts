import prisma from '@/lib/prisma';

export async function getProductReviews(productId: string) {
  const [reviews, stats] = await Promise.all([
    prisma.review.findMany({
      where: { productId, isActive: true },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.aggregate({
      where: { productId, isActive: true },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const ratingDistribution = await prisma.review.groupBy({
    by: ['rating'],
    where: { productId, isActive: true },
    _count: { rating: true },
  });

  return {
    reviews,
    averageRating: stats._avg.rating || 0,
    totalReviews: stats._count.rating,
    distribution: ratingDistribution.reduce((acc, item) => {
      acc[item.rating] = item._count.rating;
      return acc;
    }, {} as Record<number, number>),
  };
}

export async function createReview(
  userId: string,
  productId: string,
  rating: number,
  title?: string,
  comment?: string
) {
  if (rating < 1 || rating > 5) throw new Error('INVALID_RATING');

  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  const existing = await prisma.review.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) throw new Error('ALREADY_REVIEWED');

  return prisma.review.create({
    data: { userId, productId, rating, title, comment },
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function updateReview(
  userId: string,
  reviewId: string,
  data: { rating?: number; title?: string; comment?: string }
) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });
  if (!review) throw new Error('REVIEW_NOT_FOUND');

  if (data.rating && (data.rating < 1 || data.rating > 5)) {
    throw new Error('INVALID_RATING');
  }

  return prisma.review.update({
    where: { id: reviewId },
    data,
    include: {
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

export async function deleteReview(userId: string, reviewId: string) {
  const review = await prisma.review.findFirst({
    where: { id: reviewId, userId },
  });
  if (!review) throw new Error('REVIEW_NOT_FOUND');

  await prisma.review.delete({ where: { id: reviewId } });
}

// Admin functions

export async function getAllReviews(params?: { productId?: string; isActive?: boolean }) {
  const where: any = {};
  if (params?.productId) where.productId = params.productId;
  if (params?.isActive !== undefined) where.isActive = params.isActive;

  const reviews = await prisma.review.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = await prisma.review.aggregate({
    where: { isActive: true },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return { reviews, stats: { avgRating: stats._avg.rating || 0, totalReviews: stats._count.rating } };
}

export async function toggleReviewActive(reviewId: string, isActive: boolean) {
  return prisma.review.update({
    where: { id: reviewId },
    data: { isActive },
  });
}

export async function deleteReviewAdmin(reviewId: string) {
  return prisma.review.delete({ where: { id: reviewId } });
}
