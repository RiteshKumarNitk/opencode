import { NextRequest } from 'next/server';
import { listOrders } from '@/modules/orders/service';
import { getUserFromRequest } from '@/lib/auth';
import { paginatedResponse, errorResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const status = url.searchParams.get('status') ?? undefined;
    const search = url.searchParams.get('search') ?? undefined;
    const from = url.searchParams.get('from') ? new Date(url.searchParams.get('from')!) : undefined;
    const to = url.searchParams.get('to') ? new Date(url.searchParams.get('to')!) : undefined;

    const result = await listOrders({ page, limit, status, search, from, to });
    return paginatedResponse(result.orders, result.total, page, limit);
  } catch (error) {
    return errorResponse('Failed to fetch orders', 500);
  }
}
