import { NextRequest } from 'next/server';
import { updateCartItem, removeCartItem } from '@/modules/cart/service';
import { updateCartItemSchema } from '@/lib/validations';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error.flatten().fieldErrors);
    }

    const cart = await updateCartItem(params.id, parsed.data);
    return successResponse(cart);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'CART_ITEM_NOT_FOUND') return errorResponse('Cart item not found', 404);
      if (error.message === 'INSUFFICIENT_STOCK') return errorResponse('Not enough stock', 400);
    }
    return errorResponse('Failed to update cart item', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cart = await removeCartItem(params.id);
    return successResponse(cart);
  } catch (error) {
    if (error instanceof Error && error.message === 'CART_ITEM_NOT_FOUND') {
      return errorResponse('Cart item not found', 404);
    }
    return errorResponse('Failed to remove cart item', 500);
  }
}
