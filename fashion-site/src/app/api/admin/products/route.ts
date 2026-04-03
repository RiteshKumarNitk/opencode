import { NextRequest } from 'next/server';
import { createProduct, listProducts, updateProduct, deleteProduct, getProduct } from '@/modules/products/service';
import { productSchema, productFilterSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth';
import { paginatedResponse, errorResponse, forbiddenResponse, successResponse } from '@/lib/api-response';

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
      brand: url.searchParams.get('brand') ?? undefined,
      minPrice: url.searchParams.get('minPrice') ?? undefined,
      maxPrice: url.searchParams.get('maxPrice') ?? undefined,
    });

    const result = await listProducts(filters);
    return paginatedResponse(result.products, result.total, filters.page, filters.limit);
  } catch (error) {
    console.error('Admin products GET error:', error);
    return errorResponse('Failed to fetch products', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const body = await req.json();
    const data = productSchema.parse(body);

    const product = await createProduct(data);
    return successResponse(product, 'Product created successfully');
  } catch (error: any) {
    console.error('Admin products POST error:', error);
    if (error.name === 'ZodError') {
      return errorResponse('Validation failed', 400, error.errors);
    }
    return errorResponse(error.message || 'Failed to create product', 500);
  }
}
