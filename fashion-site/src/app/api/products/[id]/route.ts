import { NextRequest } from 'next/server';
import { getProduct, updateProduct, deleteProduct } from '@/modules/products/service';
import { productSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth';
import {
  successResponse, errorResponse, validationErrorResponse,
  forbiddenResponse, notFoundResponse, conflictResponse, noContentResponse,
} from '@/lib/api-response';

// GET /api/products/[id]
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await getProduct(params.id);
    if (!product) return notFoundResponse('Product not found');
    return successResponse(product);
  } catch (error) {
    return errorResponse('Failed to fetch product', 500);
  }
}

// PATCH /api/products/[id]
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const body = await req.json();
    const parsed = productSchema.partial().safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const product = await updateProduct(params.id, parsed.data);
    return successResponse(product);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'PRODUCT_NOT_FOUND') return notFoundResponse('Product not found');
      if (error.message === 'SLUG_EXISTS') return conflictResponse('Product name already taken');
    }
    return errorResponse('Failed to update product', 500);
  }
}

// DELETE /api/products/[id]
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    await deleteProduct(params.id);
    return noContentResponse();
  } catch (error) {
    if (error instanceof Error && error.message === 'PRODUCT_NOT_FOUND') {
      return notFoundResponse('Product not found');
    }
    return errorResponse('Failed to delete product', 500);
  }
}
