import { NextRequest } from 'next/server';
import { updateCategory, deleteCategory } from '@/modules/products/category-service';
import { categorySchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, validationErrorResponse, noContentResponse } from '@/lib/api-response';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role !== 'ADMIN') return errorResponse('Admin access required', 403);

    const body = await req.json();
    const parsed = categorySchema.partial().safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const category = await updateCategory(params.id, parsed.data);
    return successResponse(category);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'CATEGORY_NOT_FOUND') return errorResponse('Category not found', 404);
      if (error.message === 'SLUG_EXISTS') return errorResponse('Category name already taken', 409);
    }
    return errorResponse('Failed to update category', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role !== 'ADMIN') return errorResponse('Admin access required', 403);

    await deleteCategory(params.id);
    return noContentResponse();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'CATEGORY_NOT_FOUND') return errorResponse('Category not found', 404);
      if (error.message === 'CATEGORY_HAS_PRODUCTS') return errorResponse('Cannot delete category with products', 400);
    }
    return errorResponse('Failed to delete category', 500);
  }
}
