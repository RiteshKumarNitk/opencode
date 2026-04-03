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
