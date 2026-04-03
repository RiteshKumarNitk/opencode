import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, forbiddenResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(coupons);
  } catch (error) {
    return errorResponse('Failed to fetch coupons', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const body = await req.json();
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, isActive, startsAt, expiresAt } = body;

    if (!code || !discountType || discountValue === undefined) {
      return errorResponse('Code, discount type, and discount value are required', 400);
    }

    const existing = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (existing) return errorResponse('Coupon code already exists', 409);

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscount,
        usageLimit,
        isActive: isActive ?? true,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });
    return createdResponse(coupon);
  } catch (error) {
    return errorResponse('Failed to create coupon', 500);
  }
}
