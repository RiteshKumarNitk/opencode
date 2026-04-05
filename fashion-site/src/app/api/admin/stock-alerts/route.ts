import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const alerts = await prisma.stockAlert.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(alerts);
  } catch (error) {
    console.error('Stock alerts error:', error);
    return errorResponse('Failed to fetch stock alerts', 500);
  }
}
