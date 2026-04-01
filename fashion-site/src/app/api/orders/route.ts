import { NextRequest } from 'next/server';
import { listUserOrders, createOrder } from '@/modules/orders/service';
import { createOrderSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, createdResponse, paginatedResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const result = await listUserOrders(user.userId, page, limit);
    return paginatedResponse(result.orders, result.total, page, limit);
  } catch (error) {
    return errorResponse('Failed to fetch orders', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const sessionId = req.headers.get('x-session-id') ?? undefined;
    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const order = await createOrder(user.userId, parsed.data, sessionId);
    return createdResponse(order);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'ADDRESS_NOT_FOUND') return errorResponse('Address not found', 404);
      if (error.message === 'EMPTY_CART') return errorResponse('Cart is empty', 400);
      if (error.message === 'COUPON_INVALID') return errorResponse('Invalid coupon code', 400);
    }
    return errorResponse('Failed to create order', 500);
  }
}
