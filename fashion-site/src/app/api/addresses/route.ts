import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { addressSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse, validationErrorResponse, noContentResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return errorResponse('Unauthorized', 401);

  const addresses = await prisma.address.findMany({
    where: { userId: user.userId, deletedAt: null },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });

  return successResponse(addresses);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const parsed = addressSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    if (parsed.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.userId, isDefault: true, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { ...parsed.data, userId: user.userId },
    });

    return createdResponse(address);
  } catch (error) {
    return errorResponse('Failed to create address', 500);
  }
}
