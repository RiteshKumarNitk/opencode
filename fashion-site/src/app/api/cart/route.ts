import { NextRequest } from 'next/server';
import { getOrCreateCart, addToCart, applyCoupon, removeCoupon, mergeGuestCart } from '@/modules/cart/service';
import { addToCartSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const sessionId = req.headers.get('x-session-id') ?? undefined;

    if (!user && !sessionId) {
      return errorResponse('Session ID required for guest cart', 400);
    }

    if (user?.userId && sessionId) {
      const cart = await mergeGuestCart(sessionId, user.userId);
      return successResponse(cart);
    }

    const cart = await getOrCreateCart(user?.userId, sessionId);
    return successResponse(cart);
  } catch (error) {
    return errorResponse('Failed to fetch cart', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const sessionId = req.headers.get('x-session-id') ?? undefined;

    if (!user && !sessionId) {
      return errorResponse('Session ID required for guest cart', 400);
    }

    const body = await req.json();
    const parsed = addToCartSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const cart = await addToCart(parsed.data, user?.userId, sessionId);
    return successResponse(cart);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'PRODUCT_NOT_FOUND') return errorResponse('Product not found', 404);
      if (error.message === 'VARIANT_NOT_FOUND') return errorResponse('Variant not found', 404);
      if (error.message === 'INSUFFICIENT_STOCK') return errorResponse('Not enough stock', 400);
    }
    return errorResponse('Failed to add to cart', 500);
  }
}
