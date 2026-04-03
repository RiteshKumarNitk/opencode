import { NextRequest } from 'next/server';
import { createPasswordResetToken } from '@/modules/auth/password-reset';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) return errorResponse('Email is required', 400);

    const result = await createPasswordResetToken(email);

    console.log(`[Password Reset] Token for ${result.email}: ${result.token}`);
    console.log(`[Password Reset] Reset link: http://localhost:3000/reset-password?token=${result.token}`);

    return successResponse({
      message: 'If an account exists with this email, a reset link has been sent.',
      ...(process.env.NODE_ENV === 'development' && { token: result.token }),
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
      return successResponse({
        message: 'If an account exists with this email, a reset link has been sent.',
      });
    }
    return errorResponse('Failed to process request', 500);
  }
}
