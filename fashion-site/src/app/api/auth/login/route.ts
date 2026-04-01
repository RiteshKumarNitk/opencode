import { NextRequest } from 'next/server';
import { loginUser } from '@/modules/auth/service';
import { loginSchema } from '@/lib/validations';
import { successResponse, errorResponse, validationErrorResponse, unauthorizedResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const result = await loginUser(parsed.data);
    return successResponse(result);
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      return unauthorizedResponse('Invalid email or password');
    }
    console.error('Login error:', error);
    return errorResponse('Login failed', 500);
  }
}
