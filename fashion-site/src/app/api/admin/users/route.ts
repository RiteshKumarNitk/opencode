import { NextRequest } from 'next/server';
import { listUsers, updateUserStatus } from '@/modules/admin/service';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, paginatedResponse, errorResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search') ?? undefined;

    const result = await listUsers({ page, limit, search });
    return paginatedResponse(result.users, result.total, page, limit);
  } catch (error) {
    return errorResponse('Failed to fetch users', 500);
  }
}
