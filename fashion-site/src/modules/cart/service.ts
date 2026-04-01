import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/lib/prisma';
import type { AddToCartInput, UpdateCartItemInput } from '@/lib/validations';

// ─── Get or Create Cart ───────────────────────────────────────

export async function getOrCreateCart(userId?: string, sessionId?: string) {
  let cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { sessionId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, name: true, slug: true, price: true, images: true, isActive: true, deletedAt: true },
          },
          variant: {
            select: { id: true, name: true, sku: true, price: true, stock: true, attributes: true, images: true, isActive: true, deletedAt: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
      coupon: true,
    },
  });

  if (!cart) {
    cart = await prisma.cart.create({
      data: { userId, sessionId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, price: true, images: true, isActive: true, deletedAt: true } },
            variant: { select: { id: true, name: true, sku: true, price: true, stock: true, attributes: true, images: true, isActive: true, deletedAt: true } },
          },
        },
        coupon: true,
      },
    });
  }

  return cart;
}

// ─── Add to Cart ──────────────────────────────────────────────

export async function addToCart(input: AddToCartInput, userId?: string, sessionId?: string) {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, isActive: true, deletedAt: null },
  });
  if (!product) throw new Error('PRODUCT_NOT_FOUND');

  let unitPrice = product.price;
  let variant = null;

  if (input.variantId) {
    variant = await prisma.productVariant.findFirst({
      where: { id: input.variantId, productId: input.productId, isActive: true, deletedAt: null },
    });
    if (!variant) throw new Error('VARIANT_NOT_FOUND');
    if (variant.stock < input.quantity) throw new Error('INSUFFICIENT_STOCK');
    unitPrice = variant.price;
  }

  const cart = await getOrCreateCart(userId, sessionId);

  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId: input.productId,
      variantId: input.variantId || null,
    },
  });

  if (existingItem) {
    const newQuantity = existingItem.quantity + input.quantity;
    if (variant && variant.stock < newQuantity) throw new Error('INSUFFICIENT_STOCK');

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: {
        quantity: newQuantity,
        totalPrice: unitPrice.mul(newQuantity),
      },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: input.productId,
        variantId: input.variantId,
        quantity: input.quantity,
        unitPrice,
        totalPrice: unitPrice.mul(input.quantity),
      },
    });
  }

  return recalculateCart(cart.id);
}

// ─── Update Cart Item ─────────────────────────────────────────

export async function updateCartItem(itemId: string, input: UpdateCartItemInput) {
  const cartItem = await prisma.cartItem.findFirst({
    where: { id: itemId },
    include: { variant: true },
  });
  if (!cartItem) throw new Error('CART_ITEM_NOT_FOUND');

  if (input.quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    if (cartItem.variant && cartItem.variant.stock < input.quantity) {
      throw new Error('INSUFFICIENT_STOCK');
    }
    await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: input.quantity,
        totalPrice: cartItem.unitPrice.mul(input.quantity),
      },
    });
  }

  return recalculateCart(cartItem.cartId);
}

// ─── Remove Cart Item ─────────────────────────────────────────

export async function removeCartItem(itemId: string) {
  const cartItem = await prisma.cartItem.findFirst({ where: { id: itemId } });
  if (!cartItem) throw new Error('CART_ITEM_NOT_FOUND');

  await prisma.cartItem.delete({ where: { id: itemId } });
  return recalculateCart(cartItem.cartId);
}

// ─── Apply Coupon ─────────────────────────────────────────────

export async function applyCoupon(couponCode: string, userId?: string, sessionId?: string) {
  const cart = await getOrCreateCart(userId, sessionId);

  const coupon = await prisma.coupon.findFirst({
    where: { code: couponCode.toUpperCase(), isActive: true },
  });
  if (!coupon) throw new Error('COUPON_NOT_FOUND');

  if (coupon.expiresAt && coupon.expiresAt < new Date()) throw new Error('COUPON_EXPIRED');
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new Error('COUPON_USAGE_LIMIT');
  if (coupon.startsAt && coupon.startsAt > new Date()) throw new Error('COUPON_NOT_ACTIVE');

  const subtotal = cart.items.reduce(
    (sum: Decimal, item: any) => sum.add(item.totalPrice),
    new Decimal(0)
  );

  if (coupon.minOrderAmount && subtotal.lessThan(coupon.minOrderAmount)) {
    throw new Error('MIN_ORDER_NOT_MET');
  }

  let discount: Decimal;
  if (coupon.discountType === 'PERCENTAGE') {
    discount = subtotal.mul(coupon.discountValue).div(100);
    if (coupon.maxDiscount && discount.greaterThan(coupon.maxDiscount)) {
      discount = coupon.maxDiscount;
    }
  } else {
    discount = coupon.discountValue;
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: coupon.id, discount },
  });

  return recalculateCart(cart.id);
}

// ─── Remove Coupon ────────────────────────────────────────────

export async function removeCoupon(userId?: string, sessionId?: string) {
  const cart = await getOrCreateCart(userId, sessionId);
  await prisma.cart.update({
    where: { id: cart.id },
    data: { couponId: null, discount: 0 },
  });
  return recalculateCart(cart.id);
}

// ─── Recalculate Cart ─────────────────────────────────────────

async function recalculateCart(cartId: string) {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    include: {
      product: { select: { id: true, name: true, slug: true, price: true, images: true, isActive: true, deletedAt: true } },
      variant: { select: { id: true, name: true, sku: true, price: true, attributes: true, images: true, isActive: true, deletedAt: true } },
    },
  });

  const totalAmount = items.reduce(
    (sum: Decimal, item: any) => sum.add(item.totalPrice),
    new Decimal(0)
  );

  const cart = await prisma.cart.update({
    where: { id: cartId },
    data: { totalAmount, itemCount: items.length },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, price: true, images: true, isActive: true, deletedAt: true } },
          variant: { select: { id: true, name: true, sku: true, price: true, attributes: true, images: true, isActive: true, deletedAt: true } },
        },
      },
      coupon: true,
    },
  });

  return cart;
}

// ─── Merge Guest Cart ─────────────────────────────────────────

export async function mergeGuestCart(sessionId: string, userId: string) {
  const guestCart = await prisma.cart.findFirst({
    where: { sessionId },
    include: { items: true },
  });
  if (!guestCart) return getOrCreateCart(userId);

  let userCart = await prisma.cart.findFirst({ where: { userId } });

  if (!userCart) {
    userCart = await prisma.cart.update({
      where: { id: guestCart.id },
      data: { userId, sessionId: null },
    });
    return getOrCreateCart(userId);
  }

  for (const guestItem of guestCart.items) {
    const existingItem = await prisma.cartItem.findFirst({
      where: { cartId: userCart.id, productId: guestItem.productId, variantId: guestItem.variantId },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + guestItem.quantity;
      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty, totalPrice: existingItem.unitPrice.mul(newQty) },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: guestItem.productId,
          variantId: guestItem.variantId,
          quantity: guestItem.quantity,
          unitPrice: guestItem.unitPrice,
          totalPrice: guestItem.totalPrice,
        },
      });
    }
  }

  await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
  await prisma.cart.delete({ where: { id: guestCart.id } });

  return recalculateCart(userCart.id);
}
