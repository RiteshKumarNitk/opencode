import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/api-response';
import { getWishlistAnalytics } from '@/modules/wishlist/service';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'list';
    
    if (type === 'stats') {
      const analytics = await getWishlistAnalytics();
      return successResponse(analytics.stats);
    }

    const analytics = await getWishlistAnalytics();
    return successResponse(analytics);
  } catch (error) {
    return errorResponse('Failed to fetch wishlist data', 500);
  }
}
