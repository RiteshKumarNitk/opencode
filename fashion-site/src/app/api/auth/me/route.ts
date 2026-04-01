import { NextRequest } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { getCurrentUser } from '@/modules/auth/service';
import { successResponse, unauthorizedResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const payload = await getUserFromRequest(req);
  if (!payload) {
    return unauthorizedResponse();
  }

  const user = await getCurrentUser(payload.userId);
  if (!user) {
    return unauthorizedResponse('User not found');
  }

  return successResponse(user);
}
