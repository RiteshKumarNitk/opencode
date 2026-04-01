import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/lib/prisma';
import type { CouponInput, PaginationInput } from '@/lib/validations';

// ─── Dashboard Analytics ──────────────────────────────────────

export async function getDashboardAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalOrders, pendingOrders, totalRevenue, monthlyRevenue, weeklyRevenue,
    totalProducts, totalCustomers, lowStockVariants, recentOrders,
    orderStatusCounts, topProducts,
  ] = await Promise.all([
    prisma.order.count({ where: { deletedAt: null } }),
    prisma.order.count({ where: { status: 'PENDING', deletedAt: null } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: thirtyDaysAgo } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: sevenDaysAgo } }, _sum: { amount: true } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: 'CUSTOMER', deletedAt: null } }),
    prisma.productVariant.findMany({
      where: { stock: { lt: 10 }, deletedAt: null, isActive: true },
      include: { product: { select: { name: true } } },
      orderBy: { stock: 'asc' },
      take: 10,
    }),
    prisma.order.findMany({
      where: { deletedAt: null },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        payment: { select: { status: true, method: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.order.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: { deletedAt: null } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    }),
  ]);

  const productIds = topProducts.map((p) => p.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, name: true },
  });

  const topProductsWithNames = topProducts.map((tp) => ({
    ...tp,
    product: products.find((p) => p.id === tp.productId),
  }));

  return {
    overview: {
      totalOrders,
      pendingOrders,
      totalRevenue: totalRevenue._sum.amount ?? 0,
      monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
      weeklyRevenue: weeklyRevenue._sum.amount ?? 0,
      totalProducts,
      totalCustomers,
    },
    lowStockVariants,
    recentOrders,
    orderStatusCounts: orderStatusCounts.reduce(
      (acc, curr) => ({ ...acc, [curr.status]: curr._count }),
      {} as Record<string, number>
    ),
    topProducts: topProductsWithNames,
  };
}

// ─── Manage Users ─────────────────────────────────────────────

export async function listUsers(filters: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const where: any = { deletedAt: null, role: 'CUSTOMER' };

  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, isActive: true, lastLoginAt: true, createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: ((filters.page ?? 1) - 1) * (filters.limit ?? 20),
      take: filters.limit ?? 20,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) throw new Error('USER_NOT_FOUND');

  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, email: true, firstName: true, lastName: true, isActive: true },
  });
}

// ─── Manage Coupons ───────────────────────────────────────────

export async function listCoupons(pagination: PaginationInput) {
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
    }),
    prisma.coupon.count(),
  ]);
  return { coupons, total };
}

export async function createCoupon(input: CouponInput) {
  const existing = await prisma.coupon.findFirst({
    where: { code: input.code.toUpperCase() },
  });
  if (existing) throw new Error('COUPON_CODE_EXISTS');

  return prisma.coupon.create({
    data: {
      code: input.code.toUpperCase(),
      description: input.description,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minOrderAmount: input.minOrderAmount,
      maxDiscount: input.maxDiscount,
      usageLimit: input.usageLimit,
      isActive: input.isActive,
      startsAt: input.startsAt ? new Date(input.startsAt) : null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });
}

export async function updateCoupon(couponId: string, input: Partial<CouponInput>) {
  const coupon = await prisma.coupon.findFirst({ where: { id: couponId } });
  if (!coupon) throw new Error('COUPON_NOT_FOUND');

  return prisma.coupon.update({
    where: { id: couponId },
    data: {
      ...(input.code && { code: input.code.toUpperCase() }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.discountType && { discountType: input.discountType }),
      ...(input.discountValue !== undefined && { discountValue: input.discountValue }),
      ...(input.minOrderAmount !== undefined && { minOrderAmount: input.minOrderAmount }),
      ...(input.maxDiscount !== undefined && { maxDiscount: input.maxDiscount }),
      ...(input.usageLimit !== undefined && { usageLimit: input.usageLimit }),
      ...(input.isActive !== undefined && { isActive: input.isActive }),
      ...(input.startsAt !== undefined && { startsAt: input.startsAt ? new Date(input.startsAt) : null }),
      ...(input.expiresAt !== undefined && { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null }),
    },
  });
}

export async function deleteCoupon(couponId: string) {
  const coupon = await prisma.coupon.findFirst({ where: { id: couponId } });
  if (!coupon) throw new Error('COUPON_NOT_FOUND');

  await prisma.cart.updateMany({
    where: { couponId },
    data: { couponId: null, discount: 0 },
  });

  await prisma.coupon.delete({ where: { id: couponId } });
}
