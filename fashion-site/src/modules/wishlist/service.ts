import prisma from '@/lib/prisma';

export async function getWishlist(userId: string) {
  return prisma.wishlistItem.findMany({
    where: { userId },
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: {
            where: { deletedAt: null, isActive: true },
            select: { id: true, name: true, price: true, stock: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function addToWishlist(userId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: { id: productId, deletedAt: null },
  });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  const existing = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  if (existing) throw new Error('ALREADY_IN_WISHLIST');

  return prisma.wishlistItem.create({
    data: { userId, productId },
  });
}

export async function removeFromWishlist(userId: string, productId: string) {
  await prisma.wishlistItem.deleteMany({
    where: { userId, productId },
  });
}

export async function isInWishlist(userId: string, productId: string) {
  const item = await prisma.wishlistItem.findUnique({
    where: { userId_productId: { userId, productId } },
  });
  return !!item;
}

// Admin functions

export async function getWishlistAnalytics() {
  const [popularProducts, recentActivity, userStats] = await Promise.all([
    prisma.wishlistItem.groupBy({
      by: ['productId'],
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: 10,
    }),
    prisma.wishlistItem.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
        product: { select: { id: true, name: true, slug: true, images: true } },
      },
    }),
    prisma.user.findMany({
      where: {
        wishlistItems: { some: {} },
      },
      select: { id: true, firstName: true, lastName: true, email: true, _count: { select: { wishlistItems: true } } },
      orderBy: { wishlistItems: { _count: 'desc' } },
      take: 10,
    }),
  ]);

  const totalWishlistItems = await prisma.wishlistItem.count();
  const totalUsersWithWishlists = await prisma.user.count({
    where: { wishlistItems: { some: {} } },
  });

  const productDetails = await Promise.all(
    popularProducts.map(async (p) => {
      const product = await prisma.product.findUnique({
        where: { id: p.productId },
        select: { id: true, name: true, slug: true, images: true, price: true },
      });
      return { ...product, wishlistCount: p._count.productId };
    })
  );

  return {
    popularProducts: productDetails.filter((p) => p !== null),
    recentActivity,
    topUsers: userStats,
    stats: {
      totalWishlistItems,
      totalUsersWithWishlists,
    },
  };
}
