import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get('orderNumber');
    const email = searchParams.get('email');

    if (!orderNumber || !email) {
      return NextResponse.json({ error: 'Order number and email are required' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber: { equals: orderNumber, mode: 'insensitive' },
        OR: [
          { user: { email: { equals: email, mode: 'insensitive' } } },
          { guestEmail: { equals: email, mode: 'insensitive' } },
        ],
      },
      include: {
        items: {
          include: { product: { select: { images: true } } },
        },
        address: true,
        payment: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      totalAmount: order.totalAmount,
      subtotal: order.subtotal,
      discount: order.discount,
      shippingCost: order.      shippingCost: order.shippingCost,
      tax: order.tax,
      items: order.items.map(item => ({
        id: item.id,
        productName: item.productName,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
        product: item.product,
      })),
      address: order.address,
      payment: order.payment ? {
        method: order.payment.method,
        status: order.payment.status,
        amount: order.payment.amount,
      } : null,
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json({ error: 'Failed to track order' }, { status: 500 });
  }
}