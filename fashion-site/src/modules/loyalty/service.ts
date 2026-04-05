import prisma from '@/lib/prisma';

export async function getUserPoints(userId: string) {
  const points = await prisma.loyaltyPoints.findUnique({ where: { userId } });
  return points || { points: 0, lifetime: 0 };
}

export async function addPoints(userId: string, points: number, type: string, description: string, orderId?: string) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.loyaltyPoints.findUnique({ where: { userId } });
    
    if (existing) {
      await tx.loyaltyPoints.update({
        where: { userId },
        data: { points: existing.points + points, lifetime: existing.lifetime + points },
      });
    } else {
      await tx.loyaltyPoints.create({ data: { userId, points, lifetime: points } });
    }

    await tx.loyaltyTransaction.create({
      data: {
        userId,
        type,
        points,
        balance: existing ? existing.points + points : points,
        description,
        orderId,
        expiresAt: type === 'earn' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
      },
    });
  });
}

export async function redeemPoints(userId: string, points: number, description: string) {
  const existing = await prisma.loyaltyPoints.findUnique({ where: { userId } });
  if (!existing || existing.points < points) {
    throw new Error('Insufficient points');
  }

  await prisma.$transaction(async (tx) => {
    await tx.loyaltyPoints.update({
      where: { userId },
      data: { points: existing.points - points },
    });

    await tx.loyaltyTransaction.create({
      data: {
        userId,
        type: 'redeem',
        points: -points,
        balance: existing.points - points,
        description,
      },
    });
  });
}

export async function getUserTransactions(userId: string, limit = 20) {
  return prisma.loyaltyTransaction.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getUserTier(userId: string) {
  const points = await prisma.loyaltyPoints.findUnique({ where: { userId } });
  const tiers = await prisma.loyaltyTier.findMany({ orderBy: { minPoints: 'desc' } });
  
  const currentTier = tiers.find(t => (points?.points || 0) >= t.minPoints) || tiers[0];
  const nextTier = tiers.find(t => t.minPoints > (points?.points || 0));
  
  return { currentTier, nextTier, points: points?.points || 0, lifetime: points?.lifetime || 0 };
}

export function calculatePoints(amount: number) {
  return Math.floor(amount);
}

export async function initializeDefaultTiers() {
  const existing = await prisma.loyaltyTier.findMany();
  if (existing.length > 0) return;

  await prisma.loyaltyTier.createMany({
    data: [
      { name: 'Bronze', minPoints: 0, discount: 0, perks: [] },
      { name: 'Silver', minPoints: 1000, discount: 2, perks: ['free_shipping'] },
      { name: 'Gold', minPoints: 5000, discount: 5, perks: ['free_shipping', 'early_access'] },
      { name: 'Platinum', minPoints: 15000, discount: 10, perks: ['free_shipping', 'early_access', 'exclusive_deals'] },
    ],
  });
}