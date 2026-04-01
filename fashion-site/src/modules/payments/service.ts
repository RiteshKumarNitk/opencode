import crypto from 'crypto';
import prisma from '@/lib/prisma';

export async function createRazorpayOrder(orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, status: 'PENDING', deletedAt: null },
    include: { payment: true },
  });

  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (order.payment) throw new Error('PAYMENT_ALREADY_EXISTS');

  const gatewayOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      gatewayOrderId,
      method: 'RAZORPAY',
      status: 'PENDING',
      amount: order.totalAmount,
      currency: 'INR',
    },
  });

  return {
    paymentId: payment.id,
    gatewayOrderId,
    amount: Math.round(order.totalAmount.toNumber() * 100),
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID,
  };
}

export async function verifyRazorpayPayment(
  paymentId: string,
  gatewayPaymentId: string,
  gatewayOrderId: string,
  signature: string
) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, method: 'RAZORPAY' },
    include: { order: true },
  });

  if (!payment) throw new Error('PAYMENT_NOT_FOUND');
  if (payment.status === 'COMPLETED') throw new Error('PAYMENT_ALREADY_VERIFIED');

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(`${gatewayOrderId}|${gatewayPaymentId}`)
    .digest('hex');

  if (signature !== expectedSignature) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', failureReason: 'Invalid signature' },
    });
    throw new Error('INVALID_SIGNATURE');
  }

  const existingPayment = await prisma.payment.findFirst({
    where: { gatewayPaymentId, status: 'COMPLETED' },
  });
  if (existingPayment) throw new Error('DUPLICATE_PAYMENT_CALLBACK');

  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { gatewayPaymentId, gatewayOrderId, signature, status: 'COMPLETED' },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: 'CONFIRMED' },
    });

    return updatedPayment;
  });
}

export async function createStripePaymentIntent(orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, status: 'PENDING', deletedAt: null },
    include: { payment: true },
  });

  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (order.payment) throw new Error('PAYMENT_ALREADY_EXISTS');

  const gatewayOrderId = `pi_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      gatewayOrderId,
      method: 'STRIPE',
      status: 'PENDING',
      amount: order.totalAmount,
      currency: 'INR',
    },
  });

  return {
    paymentId: payment.id,
    clientSecret: `${gatewayOrderId}_secret_${Date.now()}`,
    amount: Math.round(order.totalAmount.toNumber() * 100),
    currency: 'inr',
  };
}

export async function verifyStripePayment(
  paymentId: string,
  gatewayPaymentId: string,
  gatewayOrderId: string
) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, method: 'STRIPE' },
    include: { order: true },
  });

  if (!payment) throw new Error('PAYMENT_NOT_FOUND');
  if (payment.status === 'COMPLETED') throw new Error('PAYMENT_ALREADY_VERIFIED');

  const existingPayment = await prisma.payment.findFirst({
    where: { gatewayPaymentId, status: 'COMPLETED' },
  });
  if (existingPayment) throw new Error('DUPLICATE_PAYMENT_CALLBACK');

  return prisma.$transaction(async (tx) => {
    const updatedPayment = await tx.payment.update({
      where: { id: payment.id },
      data: { gatewayPaymentId, gatewayOrderId, status: 'COMPLETED' },
    });

    await tx.order.update({
      where: { id: payment.orderId },
      data: { status: 'CONFIRMED' },
    });

    return updatedPayment;
  });
}

export async function handleFailedPayment(paymentId: string, reason: string) {
  const payment = await prisma.payment.findFirst({ where: { id: paymentId } });
  if (!payment) throw new Error('PAYMENT_NOT_FOUND');

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'FAILED', failureReason: reason },
  });

  return { status: 'FAILED', reason };
}

export async function handleRazorpayWebhook(body: string, signature: string) {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    throw new Error('INVALID_WEBHOOK_SIGNATURE');
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case 'payment.captured': {
      const paymentEntity = event.payload.payment.entity;
      const gatewayOrderId = paymentEntity.order_id;
      const gatewayPaymentId = paymentEntity.id;

      const payment = await prisma.payment.findFirst({
        where: { gatewayOrderId, method: 'RAZORPAY', status: 'PENDING' },
      });

      if (payment) {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { gatewayPaymentId, status: 'COMPLETED' },
          });
          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: 'CONFIRMED' },
          });
        });
      }
      break;
    }

    case 'payment.failed': {
      const paymentEntity = event.payload.payment.entity;
      const gatewayOrderId = paymentEntity.order_id;

      const payment = await prisma.payment.findFirst({
        where: { gatewayOrderId, method: 'RAZORPAY', status: 'PENDING' },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'FAILED', failureReason: paymentEntity.error_description || 'Payment failed' },
        });
      }
      break;
    }
  }
}
