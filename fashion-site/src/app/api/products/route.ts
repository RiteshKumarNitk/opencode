import { NextRequest } from 'next/server';
import { listProducts, createProduct } from '@/modules/products/service';
import { productSchema, productFilterSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth';
import {
  successResponse, paginatedResponse, createdResponse,
  errorResponse, validationErrorResponse, forbiddenResponse,
} from '@/lib/api-response';

// GET /api/products - List products (public)
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const filters = productFilterSchema.parse({
      page: url.searchParams.get('page') ?? 1,
      limit: url.searchParams.get('limit') ?? 20,
      search: url.searchParams.get('search') ?? undefined,
      categoryId: url.searchParams.get('categoryId') ?? undefined,
      minPrice: url.searchParams.get('minPrice') ?? undefined,
      maxPrice: url.searchParams.get('maxPrice') ?? undefined,
      isFeatured: url.searchParams.get('isFeatured') ?? undefined,
      isActive: url.searchParams.get('isActive') ?? true,
      sortBy: url.searchParams.get('sortBy') ?? 'createdAt',
      sortOrder: url.searchParams.get('sortOrder') ?? 'desc',
    });

    const result = await listProducts(filters);
    return paginatedResponse(result.products, result.total, filters.page, filters.limit);
  } catch (error) {
    console.error('List products error:', error);
    return errorResponse('Failed to fetch products', 500);
  }
}

// POST /api/products - Create product (admin only)
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const body = await req.json();
    const parsed = productSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const product = await createProduct(parsed.data);
    return createdResponse(product);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'SLUG_EXISTS') return errorResponse('A product with this name already exists', 409);
      if (error.message === 'CATEGORY_NOT_FOUND') return errorResponse('Category not found', 404);
    }
    console.error('Create product error:', error);
    return errorResponse('Failed to create product', 500);
  }
}
