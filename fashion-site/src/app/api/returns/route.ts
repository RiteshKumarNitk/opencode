import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, reason, itemIds, images, refundMethod } = body;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.user.id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'DELIVERED') {
      return NextResponse.json({ error: 'Only delivered orders can be returned' }, { status: 400 });
    }

    const existingReturn = await prisma.returnRequest.findFirst({
      where: { orderId },
    });

    if (existingReturn) {
      return NextResponse.json({ error: 'Return already requested for this order' }, { status: 400 });
    }

    const returnRequest = await prisma.returnRequest.create({
      data: {
        returnNumber: `RET-${nanoid(8).toUpperCase()}`,
        reason,
        images: images || [],
        refundMethod: refundMethod || 'ORIGINAL',
        orderId,
        items: itemIds ? {
          create: itemIds.map((itemId: string) => ({ orderItemId: itemId, quantity: 1 }))
        } : undefined,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'RETURN_REQUESTED' },
    });

    return NextResponse.json(returnRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating return request:', error);
    return NextResponse.json({ error: 'Failed to create return request' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    const where: any = { order: { userId: session.user.id } };
    if (orderId) where.orderId = orderId;

    const returns = await prisma.returnRequest.findMany({
      where,
      include: {
        order: {
          select: { id: true, orderNumber: true, totalAmount: true },
        },
        items: {
          include: { orderItem: { include: { product: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(returns);
  } catch (error) {
    console.error('Error fetching returns:', error);
    return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 });
  }
}