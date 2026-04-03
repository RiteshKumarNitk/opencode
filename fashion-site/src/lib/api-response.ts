import { NextResponse } from 'next/server';

// ─── Success ──────────────────────────────────────────────────

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function createdResponse<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
) {
  return NextResponse.json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}

export function noContentResponse() {
  return new NextResponse(null, { status: 204 });
}

// ─── Errors ───────────────────────────────────────────────────

export function errorResponse(message: string, status = 400, details?: unknown) {
  const responseBody: Record<string, unknown> = { success: false, error: message };
  if (details) {
    responseBody.details = details;
  }
  return NextResponse.json(responseBody, { status });
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return errorResponse(message, 401);
}

export function forbiddenResponse(message = 'Forbidden') {
  return errorResponse(message, 403);
}

export function notFoundResponse(message = 'Resource not found') {
  return errorResponse(message, 404);
}

export function conflictResponse(message: string) {
  return errorResponse(message, 409);
}

export function validationErrorResponse(details: unknown) {
  return errorResponse('Validation failed', 422, details);
}

export function rateLimitResponse() {
  return errorResponse('Too many requests', 429);
}

export function serverErrorResponse(message = 'Internal server error') {
  return errorResponse(message, 500);
}
