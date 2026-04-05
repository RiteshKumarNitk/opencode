import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';
import { nanoid } from 'nanoid';

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    let cart = await prisma.cart.findUnique({
      where: { userId: user.userId },
      include: {
        items: { include: { product: { select: { id: true, name: true, slug: true, images: true } }, variant: { select: { id: true, name: true, price: true, images: true } } } },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: user.userId },
        include: { items: { include: { product: true, variant: true } } },
      });
    }

    return NextResponse.json({ success: true, data: cart });
  } catch (error) {
    console.error('Mobile cart error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { productId, variantId, quantity = 1 } = await req.json();
    if (!productId) return errorResponse('Product ID required', 400);

    const product = await prisma.product.findFirst({ where: { id: productId, deletedAt: null, isActive: true } });
    if (!product) return errorResponse('Product not found', 404);

    let cart = await prisma.cart.findUnique({ where: { userId: user.userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: user.userId } });
    }

    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId, variantId: variantId || null },
    });

    if (existingItem) {
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      const price = variantId 
        ? (await prisma.productVariant.findUnique({ where: { id: variantId } }))?.price || product.price 
        : product.price;
      
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId, variantId, quantity, unitPrice: price, totalPrice: price * quantity },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { userId: user.userId },
      include: { items: { include: { product: true, variant: true } } },
    });

    const totalAmount = updatedCart?.items.reduce((sum, item) => sum + Number(item.totalPrice), 0) || 0;
    const itemCount = updatedCart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0;

    await prisma.cart.update({
      where: { id: cart.id },
      data: { totalAmount, itemCount },
    });

    return NextResponse.json({ success: true, data: updatedCart });
  } catch (error) {
    console.error('Mobile cart add error:', error);
    return NextResponse.json({ success: false, error: 'Failed to add to cart' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { itemId, quantity } = await req.json();
    if (!itemId || quantity === undefined) return errorResponse('Item ID and quantity required', 400);

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cart: { userId: user.userId } },
    });

    if (!cartItem) return errorResponse('Item not found', 404);

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity, totalPrice: Number(cartItem.unitPrice) * quantity },
      });
    }

    const cart = await prisma.cart.findUnique({ where: { userId: user.userId }, include: { items: true } });
    if (cart) {
      const totalAmount = cart.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
      const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      await prisma.cart.update({ where: { id: cart.id }, data: { totalAmount, itemCount } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return errorResponse('Unauthorized', 401);

    const { itemId, clearAll } = await req.json();

    if (clearAll) {
      await prisma.cartItem.deleteMany({ where: { cart: { userId: user.userId } } });
      await prisma.cart.updateMany({ where: { userId: user.userId }, data: { totalAmount: 0, itemCount: 0 } });
    } else if (itemId) {
      await prisma.cartItem.deleteMany({ where: { id: itemId, cart: { userId: user.userId } } });
    }

    const cart = await prisma.cart.findUnique({ where: { userId: user.userId }, include: { items: true } });
    if (cart) {
      const totalAmount = cart.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
      const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      await prisma.cart.update({ where: { id: cart.id }, data: { totalAmount, itemCount } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update cart' }, { status: 500 });
  }
}