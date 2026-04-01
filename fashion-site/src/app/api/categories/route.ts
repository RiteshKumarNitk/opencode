import { NextRequest } from 'next/server';
import { listCategories, createCategory } from '@/modules/products/category-service';
import { categorySchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, forbiddenResponse, conflictResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const categories = await listCategories();
    return successResponse(categories);
  } catch (error) {
    return errorResponse('Failed to fetch categories', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const category = await createCategory(parsed.data);
    return createdResponse(category);
  } catch (error) {
    if (error instanceof Error && error.message === 'SLUG_EXISTS') {
      return conflictResponse('Category with this name already exists');
    }
    return errorResponse('Failed to create category', 500);
  }
}
