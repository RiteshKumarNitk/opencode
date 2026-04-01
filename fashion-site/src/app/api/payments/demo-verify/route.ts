import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { orderId } = await req.json();
    if (!orderId) return errorResponse('Order ID is required', 400);

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: user.userId, deletedAt: null },
      include: { payment: true },
    });

    if (!order) return errorResponse('Order not found', 404);
    if (order.status === 'CONFIRMED') return errorResponse('Order already confirmed', 409);

    const gatewayPaymentId = `demo_pay_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const gatewayOrderId = `demo_order_${Date.now()}`;

    if (order.payment) {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: order.payment!.id },
          data: {
            gatewayPaymentId,
            gatewayOrderId,
            status: 'COMPLETED',
            signature: 'demo_signature',
          },
        });
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'CONFIRMED' },
        });
      });
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.payment.create({
          data: {
            orderId,
            gatewayPaymentId,
            gatewayOrderId,
            method: 'RAZORPAY',
            status: 'COMPLETED',
            amount: order.totalAmount,
            currency: 'INR',
            signature: 'demo_signature',
          },
        });
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'CONFIRMED' },
        });
      });
    }

    return successResponse({
      success: true,
      gatewayPaymentId,
      orderId,
      status: 'CONFIRMED',
    });
  } catch (error) {
    console.error('Demo payment error:', error);
    return errorResponse('Demo payment failed', 500);
  }
}
