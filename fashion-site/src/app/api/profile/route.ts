import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function PATCH(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { firstName, lastName, phone } = body;

    if (!firstName?.trim() || !lastName?.trim()) {
      return errorResponse('First name and last name are required', 400);
    }

    const updated = await prisma.user.update({
      where: { id: user.userId },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return errorResponse('Failed to update profile', 500);
  }
}
