import { NextRequest } from 'next/server';
import { resetPassword, validateResetToken } from '@/modules/auth/password-reset';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) return errorResponse('Token and password are required', 400);
    if (password.length < 8) return errorResponse('Password must be at least 8 characters', 400);

    await resetPassword(token, password);
    return successResponse({ message: 'Password reset successfully' });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_OR_EXPIRED_TOKEN') {
      return errorResponse('Invalid or expired token', 400);
    }
    return errorResponse('Failed to reset password', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return errorResponse('Token is required', 400);

    await validateResetToken(token);
    return successResponse({ valid: true });
  } catch (error) {
    return errorResponse('Invalid or expired token', 400);
  }
}
