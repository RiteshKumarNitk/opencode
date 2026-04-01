import { NextRequest } from 'next/server';
import { getOrder, cancelUserOrder, updateOrderStatus } from '@/modules/orders/service';
import { updateOrderStatusSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, validationErrorResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const userId = user.role === 'CUSTOMER' ? user.userId : undefined;
    const order = await getOrder(params.id, userId);

    if (!order) return errorResponse('Order not found', 404);
    return successResponse(order);
  } catch (error) {
    return errorResponse('Failed to fetch order', 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);
    if (user.role === 'CUSTOMER') return forbiddenResponse('Admin access required');

    const body = await req.json();
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const order = await updateOrderStatus(params.id, parsed.data);
    return successResponse(order);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'ORDER_NOT_FOUND') return errorResponse('Order not found', 404);
      if (error.message.startsWith('INVALID_TRANSITION:')) return errorResponse('Invalid status transition', 400);
    }
    return errorResponse('Failed to update order', 500);
  }
}
