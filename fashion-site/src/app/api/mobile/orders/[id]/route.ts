import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const order = await prisma.order.findFirst({
      where: { id: params.id, userId: user.userId, deletedAt: null },
      include: {
        items: { include: { product: { select: { images: true, slug: true } }, variant: true } },
        payment: true,
        address: true,
      },
    });

    if (!order) return errorResponse('Order not found', 404);

    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch order' }, { status: 500 });
  }
}