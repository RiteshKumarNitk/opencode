import { NextRequest } from 'next/server';
import { getWishlist, addToWishlist, removeFromWishlist } from '@/modules/wishlist/service';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const items = await getWishlist(user.userId);
    return successResponse(items);
  } catch (error) {
    return errorResponse('Failed to fetch wishlist', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { productId } = await req.json();
    if (!productId) return errorResponse('Product ID is required', 400);

    const item = await addToWishlist(user.userId, productId);
    return createdResponse(item);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'PRODUCT_NOT_FOUND') return errorResponse('Product not found', 404);
      if (error.message === 'ALREADY_IN_WISHLIST') return errorResponse('Already in wishlist', 409);
    }
    return errorResponse('Failed to add to wishlist', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { productId } = await req.json();
    if (!productId) return errorResponse('Product ID is required', 400);

    await removeFromWishlist(user.userId, productId);
    return successResponse({ success: true });
  } catch (error) {
    return errorResponse('Failed to remove from wishlist', 500);
  }
}
