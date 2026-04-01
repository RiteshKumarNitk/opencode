import { NextRequest } from 'next/server';
import { applyCoupon, removeCoupon } from '@/modules/cart/service';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const sessionId = req.headers.get('x-session-id') ?? undefined;

    const { code } = await req.json();
    if (!code) return errorResponse('Coupon code is required', 400);

    const cart = await applyCoupon(code, user?.userId, sessionId);
    return successResponse(cart);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'COUPON_NOT_FOUND') return errorResponse('Invalid coupon code', 400);
      if (error.message === 'COUPON_EXPIRED') return errorResponse('Coupon has expired', 400);
      if (error.message === 'MIN_ORDER_NOT_MET') return errorResponse('Minimum order amount not met', 400);
    }
    return errorResponse('Failed to apply coupon', 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    const sessionId = req.headers.get('x-session-id') ?? undefined;

    const cart = await removeCoupon(user?.userId, sessionId);
    return successResponse(cart);
  } catch (error) {
    return errorResponse('Failed to remove coupon', 500);
  }
}
