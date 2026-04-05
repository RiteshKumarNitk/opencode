import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/lib/prisma';
import type { CouponInput, PaginationInput } from '@/lib/validations';

// ─── Dashboard Analytics ──────────────────────────────────────

export async function getDashboardAnalytics() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [
    totalOrders, pendingOrders, totalRevenue, monthlyRevenue, weeklyRevenue,
    totalProducts, totalCustomers, lowStockVariants, recentOrders,
    orderStatusCounts, topProducts, recentReviews, wishlistStats,
    categorySales, lastMonthRevenue,
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
    prisma.review.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } },
        product: { select: { name: true } },
      },
    }),
    prisma.wishlistItem.count(),
    prisma.category.findMany({
      select: {
        id: true, name: true,
        products: { where: { deletedAt: null }, select: { id: true } },
      },
    }),
    prisma.payment.aggregate({ 
      where: { status: 'COMPLETED', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } }, 
      _sum: { amount: true } 
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

  const monthlyRev = Number(monthlyRevenue._sum.amount || 0);
  const lastMonthRev = Number(lastMonthRevenue._sum.amount || 0);
  const revenueGrowth = lastMonthRev > 0 ? ((monthlyRev - lastMonthRev) / lastMonthRev * 100).toFixed(1) : '0';

  const categoryData = categorySales.map(cat => ({
    name: cat.name,
    count: cat.products.length,
  })).sort((a, b) => b.count - a.count);

  const totalCategoryProducts = categoryData.reduce((sum, c) => sum + c.count, 0);
  const categoryPercentages = categoryData.map(cat => ({
    name: cat.name,
    percent: totalCategoryProducts > 0 ? Math.round(cat.count / totalCategoryProducts * 100) : 0,
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
      revenueGrowth: parseFloat(revenueGrowth as string),
    },
    lowStockVariants,
    recentOrders,
    recentReviews,
    orderStatusCounts: orderStatusCounts.reduce(
      (acc, curr) => ({ ...acc, [curr.status]: curr._count }),
      {} as Record<string, number>
    ),
    topProducts: topProductsWithNames,
    wishlistCount: wishlistStats,
    categoryBreakdown: categoryPercentages,
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

// ─── BANNER MANAGEMENT ───────────────────────────────────────────

export async function listBanners(position?: string) {
  const where = position ? { position } : {};
  return prisma.banner.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function createBanner(input: {
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  linkType?: string;
  position?: string;
  isActive?: boolean;
  sortOrder?: number;
  startsAt?: Date;
  expiresAt?: Date;
}) {
  return prisma.banner.create({ data: input });
}

export async function updateBanner(bannerId: string, input: Partial<{
  title: string;
  subtitle: string;
  image: string;
  link: string;
  linkType: string;
  position: string;
  isActive: boolean;
  sortOrder: number;
  startsAt: Date;
  expiresAt: Date;
}>) {
  return prisma.banner.update({
    where: { id: bannerId },
    data: input,
  });
}

export async function deleteBanner(bannerId: string) {
  return prisma.banner.delete({ where: { id: bannerId } });
}

// ─── RETURN/REFUND MANAGEMENT ─────────────────────────────────────

export async function listReturnRequests(status?: string, page = 1, limit = 20) {
  const where = status && status !== 'all' ? { status: status as any } : {};
  const [requests, total] = await Promise.all([
    prisma.returnRequest.findMany({
      where,
      include: {
        order: {
          select: { orderNumber: true, totalAmount: true },
        },
        items: { include: { orderItem: { include: { product: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.returnRequest.count({ where }),
  ]);
  return { requests, total };
}

export async function getReturnRequest(id: string) {
  return prisma.returnRequest.findUnique({
    where: { id },
    include: {
      order: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      items: { include: { orderItem: { include: { product: true, variant: true } } } },
    },
  });
}

export async function updateReturnRequest(id: string, input: {
  status?: any;
  refundAmount?: number;
  refundMethod?: any;
  rejectionReason?: string;
  adminNotes?: string;
}) {
  const data: any = { ...input };
  if (input.status) {
    data.processedAt = ['APPROVED', 'REJECTED', 'COMPLETED'].includes(input.status) ? new Date() : null;
  }
  return prisma.returnRequest.update({
    where: { id },
    data,
    include: { order: true },
  });
}

// ─── SHIPPING ZONES & RATES ──────────────────────────────────────

export async function listShippingZones() {
  return prisma.shippingZone.findMany({
    include: { rates: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createShippingZone(input: { name: string; countries: string[]; regions?: string[]; isActive?: boolean }) {
  return prisma.shippingZone.create({ data: input });
}

export async function updateShippingZone(id: string, input: Partial<{ name: string; countries: string[]; regions: string[]; isActive: boolean }>) {
  return prisma.shippingZone.update({ where: { id }, data: input });
}

export async function deleteShippingZone(id: string) {
  return prisma.shippingZone.delete({ where: { id } });
}

export async function createShippingRate(zoneId: string, input: {
  name: string;
  description?: string;
  price: number;
  freeShippingThreshold?: number;
  minWeight?: number;
  maxWeight?: number;
  estimatedDays?: string;
  isActive?: boolean;
  sortOrder?: number;
}) {
  return prisma.shippingRate.create({ data: { ...input, zoneId } });
}

export async function updateShippingRate(id: string, input: Partial<{
  name: string; description: string; price: number; freeShippingThreshold: number;
  minWeight: number; maxWeight: number; estimatedDays: string; isActive: boolean; sortOrder: number;
}>) {
  return prisma.shippingRate.update({ where: { id }, data: input });
}

export async function deleteShippingRate(id: string) {
  return prisma.shippingRate.delete({ where: { id } });
}

// ─── FLASH SALES ──────────────────────────────────────────────────

export async function listFlashSales(activeOnly = false) {
  const where = activeOnly ? { isActive: true, startsAt: { lte: new Date() }, endsAt: { gte: new Date() } } : {};
  return prisma.flashSale.findMany({
    where,
    include: { products: { include: { product: true } } },
    orderBy: { startsAt: 'desc' },
  });
}

export async function createFlashSale(input: {
  name: string;
  description?: string;
  discount: number;
  startsAt: Date;
  endsAt: Date;
  isActive?: boolean;
  productIds?: string[];
}) {
  const { productIds, ...data } = input;
  return prisma.flashSale.create({
    data: {
      ...data,
      products: productIds ? { create: productIds.map(id => ({ productId: id })) } : undefined,
    },
  });
}

export async function updateFlashSale(id: string, input: Partial<{
  name: string; description: string; discount: number; startsAt: Date; endsAt: Date; isActive: boolean;
}>) {
  return prisma.flashSale.update({ where: { id }, data: input });
}

export async function addFlashSaleProducts(flashSaleId: string, productIds: string[]) {
  await prisma.flashSaleProduct.createMany({
    data: productIds.map(id => ({ flashSaleId, productId: id })),
  });
}

export async function removeFlashSaleProduct(flashSaleId: string, productId: string) {
  return prisma.flashSaleProduct.deleteMany({
    where: { flashSaleId, productId },
  });
}

export async function deleteFlashSale(id: string) {
  return prisma.flashSale.delete({ where: { id } });
}

// ─── PRODUCT BUNDLES ─────────────────────────────────────────────

export async function listBundles(activeOnly = false) {
  const where = activeOnly ? { isActive: true } : {};
  return prisma.productBundle.findMany({
    where,
    include: { products: { include: { product: true } } },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createBundle(input: {
  name: string;
  description?: string;
  image?: string;
  bundlePrice: number;
  discount: number;
  isActive?: boolean;
  products?: { productId: string; quantity: number }[];
}) {
  const { products, ...data } = input;
  return prisma.productBundle.create({
    data: {
      ...data,
      products: products ? { create: products } : undefined,
    },
  });
}

export async function updateBundle(id: string, input: Partial<{
  name: string; description: string; image: string; bundlePrice: number; discount: number; isActive: boolean;
}>) {
  return prisma.productBundle.update({ where: { id }, data: input });
}

export async function addBundleProducts(bundleId: string, products: { productId: string; quantity: number }[]) {
  await prisma.bundleProduct.createMany({ data: products.map(p => ({ ...p, bundleId })) });
}

export async function removeBundleProduct(bundleId: string, productId: string) {
  return prisma.bundleProduct.deleteMany({ where: { bundleId, productId } });
}

export async function deleteBundle(id: string) {
  return prisma.productBundle.delete({ where: { id } });
}

// ─── SITE SETTINGS ────────────────────────────────────────────────

export async function getSiteSettings(category?: string) {
  const where = category ? { category } : {};
  const settings = await prisma.siteSetting.findMany({ where });
  return settings.reduce((acc: any, s) => ({ ...acc, [s.key]: s.value }), {});
}

export async function updateSiteSetting(key: string, value: any, category = 'general') {
  return prisma.siteSetting.upsert({
    where: { key },
    create: { key, value, category },
    update: { value, category },
  });
}

export async function bulkUpdateSettings(settings: { key: string; value: any; category?: string }[]) {
  await prisma.$transaction(settings.map(s => 
    prisma.siteSetting.upsert({
      where: { key: s.key },
      create: { key: s.key, value: s.value, category: s.category || 'general' },
      update: { value: s.value },
    })
  ));
}

// ─── AUDIT LOGS ──────────────────────────────────────────────────

export async function listAuditLogs(filters: {
  userId?: string;
  action?: string;
  entityType?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}) {
  const where: any = {};
  if (filters.userId) where.userId = filters.userId;
  if (filters.action) where.action = filters.action as any;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }
  
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: { user: { select: { email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: ((filters.page ?? 1) - 1) * (filters.limit ?? 50),
      take: filters.limit ?? 50,
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { logs, total };
}

export async function createAuditLog(input: {
  action: any;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  return prisma.auditLog.create({ data: input });
}

// ─── BLOG / CMS ──────────────────────────────────────────────────

export async function listBlogPosts(publishedOnly = false) {
  const where = publishedOnly ? { isPublished: true } : {};
  return prisma.blogPost.findMany({
    where,
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function getBlogPost(idOrSlug: string) {
  return prisma.blogPost.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
  });
}

export async function createBlogPost(input: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  image?: string;
  author?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  sortOrder?: number;
  publishedAt?: Date;
}) {
  return prisma.blogPost.create({ data: input });
}

export async function updateBlogPost(id: string, input: Partial<{
  title: string; slug: string; content: string; excerpt: string;
  image: string; author: string; isPublished: boolean; isFeatured: boolean;
  tags: string[]; metaTitle: string; metaDescription: string; sortOrder: number; publishedAt: Date;
}>) {
  const data: any = { ...input };
  if (input.isPublished && !input.publishedAt) {
    data.publishedAt = new Date();
  }
  return prisma.blogPost.update({ where: { id }, data });
}

export async function deleteBlogPost(id: string) {
  return prisma.blogPost.delete({ where: { id } });
}

// ─── EMAIL MARKETING ──────────────────────────────────────────────

export async function listNewsletterSubscribers(activeOnly = false) {
  const where = activeOnly ? { isActive: true } : {};
  return prisma.newsletterSubscriber.findMany({
    where,
    orderBy: { subscribedAt: 'desc' },
  });
}

export async function addNewsletterSubscriber(email: string) {
  return prisma.newsletterSubscriber.upsert({
    where: { email },
    create: { email, isActive: true },
    update: { isActive: true, unsubscribedAt: null },
  });
}

export async function unsubscribeNewsletter(email: string) {
  return prisma.newsletterSubscriber.update({
    where: { email },
    data: { isActive: false, unsubscribedAt: new Date() },
  });
}

export async function getSubscriberStats() {
  const [total, active, inactive, recent] = await Promise.all([
    prisma.newsletterSubscriber.count(),
    prisma.newsletterSubscriber.count({ where: { isActive: true } }),
    prisma.newsletterSubscriber.count({ where: { isActive: false } }),
    prisma.newsletterSubscriber.count({
      where: { subscribedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);
  return { total, active, inactive, recent };
}

// ─── INVENTORY MANAGEMENT ─────────────────────────────────────────

export async function getInventoryReport(filters?: {
  categoryId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
}) {
  const where: any = { deletedAt: null };
  if (filters?.lowStock) where.stock = { lt: 10, gt: 0 };
  if (filters?.outOfStock) where.stock = 0;
  
  const variants = await prisma.productVariant.findMany({
    where,
    include: {
      product: {
        select: { id: true, name: true, sku: true, category: { select: { name: true } } },
      },
    },
    orderBy: { stock: 'asc' },
  });

  const grouped = variants.reduce((acc: any, v) => {
    const cat = v.product.category?.name || 'Uncategorized';
    if (!acc[cat]) acc[cat] = { total: 0, lowStock: 0, outOfStock: 0, variants: [] };
    acc[cat].total++;
    if (v.stock === 0) acc[cat].outOfStock++;
    else if (v.stock < 10) acc[cat].lowStock++;
    acc[cat].variants.push(v);
    return acc;
  }, {});

  return grouped;
}

export async function bulkUpdateStock(updates: { variantId: string; stock: number }[]) {
  await prisma.$transaction(updates.map(u => 
    prisma.productVariant.update({ where: { id: u.variantId }, data: { stock: u.stock } })
  ));
}

// ─── REPORTS & EXPORTS ───────────────────────────────────────────

export async function getSalesReport(startDate: Date, endDate: Date) {
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
      deletedAt: null,
      status: { notIn: ['CANCELLED'] },
    },
    include: {
      user: { select: { email: true, firstName: true, lastName: true } },
      items: { select: { productName: true, quantity: true, totalPrice: true } },
      payment: { select: { method: true, status: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  const summary = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
    totalDiscount: orders.reduce((sum, o) => sum + Number(o.discount), 0),
    totalShipping: orders.reduce((sum, o) => sum + Number(o.shippingCost), 0),
  };

  const byStatus = orders.reduce((acc: any, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const daily = orders.reduce((acc: any, o) => {
    const date = o.createdAt.toISOString().split('T')[0];
    if (!acc[date]) acc[date] = { orders: 0, revenue: 0 };
    acc[date].orders++;
    acc[date].revenue += Number(o.totalAmount);
    return acc;
  }, {});

  return { orders, summary, byStatus, daily };
}

export async function getProductPerformanceReport(startDate: Date, endDate: Date) {
  const items = await prisma.orderItem.findMany({
    where: { order: { createdAt: { gte: startDate, lte: endDate }, deletedAt: null } },
    select: {
      productId: true,
      productName: true,
      quantity: true,
      totalPrice: true,
    },
  });

  const productStats = items.reduce((acc: any, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = { name: item.productName, quantity: 0, revenue: 0 };
    }
    acc[item.productId].quantity += item.quantity;
    acc[item.productId].revenue += Number(item.totalPrice);
    return acc;
  }, {});

  return Object.values(productStats)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 50);
}

export async function getCustomerReport(startDate: Date, endDate: Date) {
  const customers = await prisma.user.findMany({
    where: {
      role: 'CUSTOMER',
      deletedAt: null,
      orders: { some: { createdAt: { gte: startDate, lte: endDate } } },
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      createdAt: true,
      orders: {
        where: { createdAt: { gte: startDate, lte: endDate } },
        select: { totalAmount: true },
      },
    },
  });

  return customers.map(c => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`,
    email: c.email,
    joinedAt: c.createdAt,
    totalOrders: c.orders.length,
    totalSpent: c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
    avgOrderValue: c.orders.length ? c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0) / c.orders.length : 0,
  })).sort((a, b) => b.totalSpent - a.totalSpent);
}

// ─── ADMIN ROLES ────────────────────────────────────────────────

export async function listAdminRoles() {
  return prisma.adminRole.findMany({
    include: { _count: { select: { admins: true } } },
    orderBy: { name: 'asc' },
  });
}

export async function createAdminRole(input: { name: string; description?: string; permissions: string[]; isDefault?: boolean }) {
  if (input.isDefault) {
    await prisma.adminRole.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  }
  return prisma.adminRole.create({ data: input });
}

export async function updateAdminRole(id: string, input: Partial<{ name: string; description: string; permissions: string[]; isDefault: boolean }>) {
  if (input.isDefault) {
    await prisma.adminRole.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
  }
  return prisma.adminRole.update({ where: { id }, data: input });
}

export async function deleteAdminRole(id: string) {
  const role = await prisma.adminRole.findUnique({ where: { id } });
  if (role?.isDefault) throw new Error('CANNOT_DELETE_DEFAULT_ROLE');
  return prisma.adminRole.delete({ where: { id } });
}

export async function listAdmins() {
  return prisma.adminUser.findMany({
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      role: true,
    },
  });
}

export async function assignAdminRole(userId: string, roleId: string) {
  return prisma.adminUser.upsert({
    where: { userId },
    create: { userId, roleId },
    update: { roleId },
  });
}

export async function removeAdmin(userId: string) {
  return prisma.adminUser.delete({ where: { userId } });
}
