import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { errorResponse, successResponse } from '@/lib/api-response';
import { getUserPoints, getUserTransactions, getUserTier, addPoints, redeemPoints, calculatePoints, initializeDefaultTiers } from '@/modules/loyalty/service';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    await initializeDefaultTiers();

    const [points, transactions, tierInfo] = await Promise.all([
      getUserPoints(user.userId),
      getUserTransactions(user.userId),
      getUserTier(user.userId),
    ]);

    return successResponse({ points: points.points, lifetime: points.lifetime, transactions, tier: tierInfo });
  } catch (error) {
    console.error('Loyalty error:', error);
    return errorResponse('Failed to get loyalty info', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { action, points, description } = await req.json();

    if (action === 'redeem') {
      if (!points || points <= 0) return errorResponse('Invalid points', 400);
      await redeemPoints(user.userId, points, description || 'Redemed for discount');
      return successResponse({ message: 'Points redeemed successfully' });
    }

    if (action === 'earn') {
      const amount = parseFloat(req.headers.get('x-order-amount') || '0');
      if (amount > 0) {
        const earnedPoints = calculatePoints(amount);
        await addPoints(user.userId, earnedPoints, 'earn', `Earned from order`, req.headers.get('x-order-id') || undefined);
        return successResponse({ points: earnedPoints, message: 'Points earned!' });
      }
    }

    return errorResponse('Invalid action', 400);
  } catch (error: any) {
    if (error.message === 'Insufficient points') {
      return errorResponse('Insufficient points', 400);
    }
    return errorResponse('Failed to process request', 500);
  }
}