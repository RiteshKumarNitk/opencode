import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!coupon) return notFoundResponse('Coupon not found');

    const body = await req.json();
    const { code, description, discountType, discountValue, minOrderAmount, maxDiscount, usageLimit, isActive, startsAt, expiresAt } = body;

    if (code && code.toUpperCase() !== coupon.code) {
      const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
      if (existing) return errorResponse('Coupon code already exists', 409);
    }

    const updated = await prisma.coupon.update({
      where: { id: params.id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(description !== undefined && { description }),
        ...(discountType && { discountType }),
        ...(discountValue !== undefined && { discountValue }),
        ...(minOrderAmount !== undefined && { minOrderAmount }),
        ...(maxDiscount !== undefined && { maxDiscount }),
        ...(usageLimit !== undefined && { usageLimit }),
        ...(isActive !== undefined && { isActive }),
        ...(startsAt !== undefined && { startsAt: startsAt ? new Date(startsAt) : null }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
      },
    });
    return successResponse(updated);
  } catch (error) {
    return errorResponse('Failed to update coupon', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
    if (!coupon) return notFoundResponse('Coupon not found');

    await prisma.coupon.delete({ where: { id: params.id } });
    return successResponse({ success: true });
  } catch (error) {
    return errorResponse('Failed to delete coupon', 500);
  }
}
