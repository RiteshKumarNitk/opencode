import { NextRequest } from 'next/server';
import { registerUser } from '@/modules/auth/service';
import { registerSchema } from '@/lib/validations';
import { successResponse, errorResponse, validationErrorResponse, conflictResponse } from '@/lib/api-response';
import { mergeGuestCart } from '@/modules/cart/service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const result = await registerUser(parsed.data);

    if (body.sessionId) {
      await mergeGuestCart(body.sessionId, result.user.id);
    }

    return successResponse(result, 201);
  } catch (error) {
    if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
      return conflictResponse('An account with this email already exists');
    }
    return errorResponse('Registration failed', 500);
  }
}
