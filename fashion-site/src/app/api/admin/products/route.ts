import { NextRequest } from 'next/server';
import { listProducts } from '@/modules/products/service';
import { productFilterSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth';
import { paginatedResponse, errorResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const url = new URL(req.url);
    const filters = productFilterSchema.parse({
      page: url.searchParams.get('page') ?? 1,
      limit: url.searchParams.get('limit') ?? 20,
      search: url.searchParams.get('search') ?? undefined,
      categoryId: url.searchParams.get('categoryId') ?? undefined,
      sortBy: url.searchParams.get('sortBy') ?? 'createdAt',
      sortOrder: url.searchParams.get('sortOrder') ?? 'desc',
    });

    const result = await listProducts(filters);
    return paginatedResponse(result.products, result.total, filters.page, filters.limit);
  } catch (error) {
    return errorResponse('Failed to fetch products', 500);
  }
}
