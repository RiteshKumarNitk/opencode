import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: user.userId, deletedAt: null },
        include: { items: { include: { product: { select: { images: true } } } }, payment: true, address: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where: { userId: user.userId, deletedAt: null } }),
    ]);

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { addressId, paymentMethod, couponCode } = await req.json();

    const cart = await prisma.cart.findUnique({
      where: { userId: user.userId },
      include: { items: { include: { product: true, variant: true } }, coupon: true },
    });

    if (!cart || cart.items.length === 0) {
      return errorResponse('Cart is empty', 400);
    }

    const address = await prisma.address.findFirst({ where: { id: addressId, userId: user.userId } });
    if (!address) return errorResponse('Address not found', 404);

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const discount = cart.coupon ? Number(cart.discount) : 0;
    const shippingCost = subtotal > 500 ? 0 : 50;
    const tax = Math.round(subtotal * 0.18);
    const totalAmount = subtotal - discount + shippingCost + tax;

    const orderNumber = `ORD-${nanoid(8).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.userId,
        addressId,
        subtotal,
        discount,
        shippingCost,
        tax,
        totalAmount,
        couponCode: couponCode || cart.coupon?.code,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.product?.name || 'Product',
            sku: item.variant?.sku || item.product?.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            attributes: item.variant?.attributes,
          })),
        },
      },
      include: { items: true, address: true },
    });

    await prisma.payment.create({
      data: { orderId: order.id, method: paymentMethod || 'RAZORPAY', status: 'PENDING', amount: totalAmount },
    });

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await prisma.cart.update({ where: { id: cart.id }, data: { totalAmount: 0, itemCount: 0, couponId: null, discount: 0 } });

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Mobile order create error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create order' }, { status: 500 });
  }
}