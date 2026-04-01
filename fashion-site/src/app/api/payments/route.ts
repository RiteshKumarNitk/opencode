import { NextRequest } from 'next/server';
import { createRazorpayOrder, createStripePaymentIntent } from '@/modules/payments/service';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { orderId, method } = await req.json();
    if (!orderId) return errorResponse('Order ID is required', 400);

    let result;
    if (method === 'STRIPE') {
      result = await createStripePaymentIntent(orderId);
    } else {
      result = await createRazorpayOrder(orderId);
    }

    return successResponse(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'ORDER_NOT_FOUND') return errorResponse('Order not found', 404);
      if (error.message === 'PAYMENT_ALREADY_EXISTS') return errorResponse('Payment already initiated', 409);
    }
    return errorResponse('Failed to create payment', 500);
  }
}
