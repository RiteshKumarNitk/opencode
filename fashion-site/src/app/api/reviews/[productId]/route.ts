import { NextRequest } from 'next/server';
import { getProductReviews, createReview } from '@/modules/reviews/service';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, createdResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const data = await getProductReviews(params.productId);
    return successResponse(data);
  } catch (error) {
    return errorResponse('Failed to fetch reviews', 500);
  }
}

export async function POST(req: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const body = await req.json();
    const { rating, title, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return errorResponse('Rating must be between 1 and 5', 400);
    }

    const review = await createReview(user.userId, params.productId, rating, title, comment);
    return createdResponse(review);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'PRODUCT_NOT_FOUND') return errorResponse('Product not found', 404);
      if (error.message === 'ALREADY_REVIEWED') return errorResponse('You already reviewed this product', 409);
      if (error.message === 'INVALID_RATING') return errorResponse('Rating must be between 1 and 5', 400);
    }
    return errorResponse('Failed to create review', 500);
  }
}
