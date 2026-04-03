import { Decimal } from '@prisma/client/runtime/library';
import prisma from '@/lib/prisma';
import { generateOrderNumber } from '@/lib/slug';
import { mergeGuestCart } from '@/modules/cart/service';
import type { CreateOrderInput, UpdateOrderStatusInput } from '@/lib/validations';

// ─── Create Order ─────────────────────────────────────────────

export async function createOrder(
  userId: string,
  input: CreateOrderInput,
  sessionId?: string
) {
  const address = await prisma.address.findFirst({
    where: { id: input.addressId, userId, deletedAt: null },
  });

  if (!address) throw new Error('ADDRESS_NOT_FOUND');

  if (sessionId) {
    await mergeGuestCart(sessionId, userId);
  }

  const cart = await prisma.cart.findFirst({
    where: { userId },
    include: {
      items: { include: { product: true, variant: true } },
      coupon: true,
    },
  });

  if (!cart || cart.items.length === 0) throw new Error('EMPTY_CART');

  for (const item of cart.items) {
    if (!item.product || item.product.deletedAt || !item.product.isActive) {
      throw new Error(`PRODUCT_UNAVAILABLE:${item.product?.name ?? 'Unknown'}`);
    }
    if (item.variant) {
      if (item.variant.deletedAt || !item.variant.isActive) {
        throw new Error(`VARIANT_UNAVAILABLE:${item.variant.name}`);
      }
      if (item.variant.stock < item.quantity) {
        throw new Error(`INSUFFICIENT_STOCK:${item.product.name}:${item.variant.name}`);
      }
    }
  }

  if (input.couponCode) {
    const coupon = await prisma.coupon.findFirst({
      where: { code: input.couponCode.toUpperCase(), isActive: true },
    });
    if (!coupon) throw new Error('COUPON_INVALID');
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new Error('COUPON_USAGE_LIMIT_REACHED');
    }
  }

  const subtotal = cart.items.reduce(
    (sum, item) => sum.add(item.totalPrice),
    new Decimal(0)
  );

  const discount = cart.discount || new Decimal(0);
  const tax = subtotal.minus(discount).mul(0.18);
  const totalAmount = subtotal.minus(discount).plus(tax);

  const order = await prisma.$transaction(async (tx) => {
    for (const item of cart.items) {
      if (item.variantId) {
        const variant = await tx.productVariant.findFirst({
          where: { id: item.variantId },
        });
        if (!variant || variant.stock < item.quantity) {
          throw new Error(`STOCK_CHANGED:${item.product.name}`);
        }
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    const newOrder = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        status: 'PENDING',
        subtotal,
        tax,
        shippingCost: new Decimal(0),
        discount,
        totalAmount,
        notes: input.notes,
        couponCode: input.couponCode?.toUpperCase(),
        userId,
        addressId: input.addressId,
        items: {
          create: cart.items.map((item) => ({
            product: { connect: { id: item.productId } },
            productName: item.product.name,
            sku: item.variant?.sku ?? undefined,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            attributes: item.variant?.attributes ?? undefined,
            variantId: item.variantId,
          })),
        },
      },
      include: {
        items: true,
        address: true,
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
    });

    if (input.couponCode) {
      await tx.coupon.updateMany({
        where: { code: input.couponCode.toUpperCase() },
        data: { usedCount: { increment: 1 } },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
    await tx.cart.update({
      where: { id: cart.id },
      data: { totalAmount: 0, itemCount: 0, discount: 0, couponId: null },
    });

    return newOrder;
  });

  return order;
}

// ─── List Orders (User) ───────────────────────────────────────

export async function listUserOrders(
  userId: string,
  page: number = 1,
  limit: number = 20
) {
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userId, deletedAt: null },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, slug: true, images: true } },
            variant: { select: { id: true, name: true, attributes: true } },
          },
        },
        payment: { select: { status: true, method: true } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where: { userId, deletedAt: null } }),
  ]);

  return { orders, total };
}

// ─── Get Single Order ─────────────────────────────────────────

export async function getOrder(orderIdOrNumber: string, userId?: string) {
  return prisma.order.findFirst({
    where: {
      deletedAt: null,
      OR: [{ id: orderIdOrNumber }, { orderNumber: orderIdOrNumber }],
      ...(userId && { userId }),
    },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, slug: true, images: true, price: true } },
          variant: { select: { id: true, name: true, attributes: true, price: true } },
        },
      },
      payment: true,
      address: true,
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
}

// ─── Update Order Status (Admin) ──────────────────────────────

export async function updateOrderStatus(
  orderId: string,
  input: UpdateOrderStatusInput
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, deletedAt: null },
  });

  if (!order) throw new Error('ORDER_NOT_FOUND');

  const validTransitions: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: ['REFUNDED'],
    CANCELLED: [],
    REFUNDED: [],
  };

  if (!validTransitions[order.status]?.includes(input.status)) {
    throw new Error(`INVALID_TRANSITION:${order.status}:${input.status}`);
  }

  return prisma.$transaction(async (tx) => {
    const updateData: any = { status: input.status };

    if (input.status === 'CONFIRMED') {
      updateData.confirmedAt = new Date();
    }

    if (input.status === 'PROCESSING') {
      updateData.processingAt = new Date();
    }

    if (input.status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    }

    if (input.status === 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    if (input.status === 'CANCELLED') {
      updateData.cancelledAt = new Date();

      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      const payment = await tx.payment.findFirst({
        where: { orderId, status: 'COMPLETED' },
      });
      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'REFUNDED' },
        });
      }
    }

    if (input.status === 'REFUNDED') {
      await tx.payment.updateMany({
        where: { orderId },
        data: { status: 'REFUNDED' },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: updateData,
      include: { items: true, payment: true, address: true },
    });
  });
}

// ─── List All Orders (Admin) ──────────────────────────────────

export async function listOrders(filters: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  from?: Date;
  to?: Date;
}) {
  const where: any = { deletedAt: null };

  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { orderNumber: { contains: filters.search, mode: 'insensitive' } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      { user: { firstName: { contains: filters.search, mode: 'insensitive' } } },
      { user: { lastName: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = filters.from;
    if (filters.to) where.createdAt.lte = filters.to;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        payment: { select: { status: true, method: true, amount: true } },
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: ((filters.page ?? 1) - 1) * (filters.limit ?? 20),
      take: filters.limit ?? 20,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total };
}

// ─── Cancel Order (Customer) ──────────────────────────────────

export async function cancelUserOrder(userId: string, orderId: string) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, userId, deletedAt: null },
  });

  if (!order) throw new Error('ORDER_NOT_FOUND');
  if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
    throw new Error('ORDER_NOT_CANCELLABLE');
  }

  return updateOrderStatus(orderId, { status: 'CANCELLED' });
}
