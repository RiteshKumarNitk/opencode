import prisma from '@/lib/prisma';

export async function trackEvent(data: {
  eventType: string;
  userId?: string;
  sessionId?: string;
  productId?: string;
  orderId?: string;
  metadata?: Record<string, any>;
}) {
  return prisma.analyticsEvent.create({
    data: {
      eventType: data.eventType,
      userId: data.userId,
      sessionId: data.sessionId,
      metadata: data.metadata || {},
    },
  });
}

export async function getPageViews(days = 30) {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const result = await prisma.$queryRaw<{ date: Date; count: bigint }[]>`
    SELECT DATE(createdAt) as date, COUNT(*) as count
    FROM analytics_events
    WHERE eventType = 'page_view' AND createdAt >= ${start}
    GROUP BY DATE(createdAt)
    ORDER BY date DESC
  `;
  
  return result.map(r => ({ date: r.date.toISOString().split('T')[0], views: Number(r.count) }));
}

export async function getTopProducts(limit = 10, days = 30) {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  return prisma.analyticsEvent.groupBy({
    by: ['metadata'],
    where: {
      eventType: 'product_view',
      createdAt: { gte: start },
    },
    _count: true,
    orderBy: { _count: 'desc' },
    take: limit,
  });
}

export async function getConversionStats(days = 30) {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const [cartAdds, checkouts, purchases] = await Promise.all([
    prisma.analyticsEvent.count({
      where: { eventType: 'add_to_cart', createdAt: { gte: start } },
    }),
    prisma.analyticsEvent.count({
      where: { eventType: 'begin_checkout', createdAt: { gte: start } },
    }),
    prisma.order.count({
      where: { createdAt: { gte: start }, status: { notIn: ['CANCELLED', 'REFUNDED'] } },
    }),
  ]);
  
  return {
    cartAdds,
    checkouts,
    purchases,
    cartToCheckout: checkouts > 0 ? ((purchases / checkouts) * 100).toFixed(1) : 0,
    addToPurchase: cartAdds > 0 ? ((purchases / cartAdds) * 100).toFixed(1) : 0,
  };
}

export async function getRevenueAnalytics(days = 30) {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const orders = await prisma.order.findMany({
    where: {
      createdAt: { gte: start },
      status: { notIn: ['CANCELLED', 'REFUNDED'] },
    },
    select: { totalAmount: true, createdAt: true },
  });
  
  const daily = orders.reduce((acc, o) => {
    const date = o.createdAt.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + Number(o.totalAmount);
    return acc;
  }, {} as Record<string, number>);
  
  const total = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
  const avgOrder = orders.length > 0 ? total / orders.length : 0;
  
  return { daily, total, avgOrder, count: orders.length };
}

export async function getTrafficSources(days = 30) {
  const start = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  
  const events = await prisma.analyticsEvent.findMany({
    where: { eventType: 'page_view', createdAt: { gte: start } },
    select: { metadata: true },
  });
  
  const sources = events.reduce((acc, e) => {
    const source = (e.metadata as any)?.source || 'direct';
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(sources)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}