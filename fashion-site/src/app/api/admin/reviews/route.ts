import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/api-response';
import { getAllReviews, toggleReviewActive, deleteReviewAdmin } from '@/modules/reviews/service';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId') || undefined;
    const isActive = searchParams.get('isActive');
    
    const params: any = {};
    if (productId) params.productId = productId;
    if (isActive !== null) params.isActive = isActive === 'true';

    const result = await getAllReviews(params);
    return successResponse(result);
  } catch (error) {
    return errorResponse('Failed to fetch reviews', 500);
  }
}
