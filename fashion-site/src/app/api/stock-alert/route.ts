import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { productId, variantId, email } = await req.json();

    if (!email || !email.includes('@')) {
      return errorResponse('Valid email is required', 400);
    }

    const existing = await prisma.stockAlert.findFirst({
      where: { productId, variantId: variantId || null, email },
    });

    if (existing) {
      return errorResponse('You already have this alert', 400);
    }

    const alert = await prisma.stockAlert.create({
      data: { productId, variantId: variantId || null, email },
    });

    return successResponse(alert);
  } catch (error) {
    console.error('Stock alert error:', error);
    return errorResponse('Failed to create alert', 500);
  }
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const alerts = await prisma.stockAlert.findMany({
      where: { email: user.email },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(alerts);
  } catch (error) {
    return errorResponse('Failed to fetch alerts', 500);
  }
}