import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse, forbiddenResponse } from '@/lib/api-response';
import { toggleReviewActive, deleteReviewAdmin } from '@/modules/reviews/service';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const { id } = await params;
    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== 'boolean') {
      return errorResponse('isActive boolean is required', 400);
    }

    const review = await toggleReviewActive(id, isActive);
    return successResponse(review);
  } catch (error) {
    return errorResponse('Failed to update review', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'ADMIN') return forbiddenResponse('Admin access required');

    const { id } = await params;
    await deleteReviewAdmin(id);
    return successResponse({ deleted: true });
  } catch (error) {
    return errorResponse('Failed to delete review', 500);
  }
}
