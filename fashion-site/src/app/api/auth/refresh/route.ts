import { NextRequest } from 'next/server';
import { refreshAccessToken } from '@/modules/auth/service';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return errorResponse('Refresh token is required', 400);
    }

    const result = await refreshAccessToken(refreshToken);
    return successResponse(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'INVALID_REFRESH_TOKEN') {
        return unauthorizedResponse('Invalid or expired refresh token');
      }
      if (error.message === 'USER_NOT_FOUND') {
        return unauthorizedResponse('User account no longer exists');
      }
    }
    console.error('Refresh error:', error);
    return errorResponse('Token refresh failed', 500);
  }
}
