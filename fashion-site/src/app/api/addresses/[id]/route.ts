import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { addressSchema } from '@/lib/validations';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, validationErrorResponse, noContentResponse } from '@/lib/api-response';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const existing = await prisma.address.findFirst({
      where: { id: params.id, userId: user.userId, deletedAt: null },
    });
    if (!existing) return errorResponse('Address not found', 404);

    const body = await req.json();
    const parsed = addressSchema.partial().safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    if (parsed.data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.userId, isDefault: true, id: { not: params.id }, deletedAt: null },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: params.id },
      data: parsed.data,
    });

    return successResponse(address);
  } catch (error) {
    return errorResponse('Failed to update address', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getUserFromRequest(req);
  if (!user) return errorResponse('Unauthorized', 401);

  const existing = await prisma.address.findFirst({
    where: { id: params.id, userId: user.userId, deletedAt: null },
  });
  if (!existing) return errorResponse('Address not found', 404);

  await prisma.address.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });

  return noContentResponse();
}
