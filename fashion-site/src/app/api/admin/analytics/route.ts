import { NextRequest } from 'next/server';
import { getDashboardAnalytics } from '@/modules/admin/service';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const analytics = await getDashboardAnalytics();
    return successResponse(analytics);
  } catch (error) {
    return errorResponse('Failed to fetch analytics', 500);
  }
}
