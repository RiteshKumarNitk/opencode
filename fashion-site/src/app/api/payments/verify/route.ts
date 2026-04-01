import { NextRequest } from 'next/server';
import { verifyRazorpayPayment, verifyStripePayment, handleFailedPayment } from '@/modules/payments/service';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { paymentId, method, gatewayPaymentId, gatewayOrderId, signature } = body;

    if (!paymentId || !method) return errorResponse('Payment ID and method are required', 400);

    let result;
    if (method === 'STRIPE') {
      result = await verifyStripePayment(paymentId, gatewayPaymentId, gatewayOrderId);
    } else {
      if (!signature) return errorResponse('Signature is required for Razorpay', 400);
      result = await verifyRazorpayPayment(paymentId, gatewayPaymentId, gatewayOrderId, signature);
    }

    return successResponse(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'PAYMENT_NOT_FOUND') return errorResponse('Payment not found', 404);
      if (error.message === 'PAYMENT_ALREADY_VERIFIED') return errorResponse('Already verified', 409);
      if (error.message === 'INVALID_SIGNATURE') return errorResponse('Invalid payment signature', 400);
    }
    return errorResponse('Payment verification failed', 500);
  }
}
