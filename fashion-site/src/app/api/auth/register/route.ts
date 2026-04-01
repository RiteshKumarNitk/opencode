import { NextRequest } from 'next/server';
import { registerUser } from '@/modules/auth/service';
import { registerSchema } from '@/lib/validations';
import { successResponse, errorResponse, validationErrorResponse, conflictResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const result = await registerUser(parsed.data);
    return successResponse(result, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      return conflictResponse('An account with this email already exists');
    }
    return errorResponse('Registration failed', 500);
  }
}
