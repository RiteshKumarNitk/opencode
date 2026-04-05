import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slug'

export const vendorService = {
  async createVendor(data: {
    userId: string
    name: string
    description?: string
    email: string
    phone?: string
  }) {
    const slug = slugify(data.name)
    
    return prisma.vendor.create({
      data: {
        userId: data.userId,
        name: data.name,
        slug,
        description: data.description,
        email: data.email,
        phone: data.phone,
        status: 'PENDING',
      },
    })
  },

  async getVendorByUserId(userId: string) {
    return prisma.vendor.findUnique({
      where: { userId },
      include: {
        products: {
          include: { product: true },
        },
      },
    })
  },

  async getVendorBySlug(slug: string) {
    return prisma.vendor.findUnique({
      where: { slug },
      include: {
        products: {
          where: { isActive: true },
          include: { product: { include: { category: true } } },
        },
        reviews: {
          where: { isActive: true },
          include: { user: { select: { firstName: true, lastName: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    })
  },

  async addProduct(vendorId: string, productId: string) {
    return prisma.vendorProduct.create({
      data: {
        vendorId,
        productId,
      },
    })
  },

  async getVendorOrders(vendorId: string, status?: string) {
    return prisma.vendorOrder.findMany({
      where: {
        vendorId,
        ...(status && { status }),
      },
      include: {
        order: { include: { address: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    })
  },

  async updateOrderStatus(vendorOrderId: string, status: string) {
    return prisma.vendorOrder.update({
      where: { id: vendorOrderId },
      data: { status },
    })
  },

  async requestPayout(vendorId: string, amount: number, method: string) {
    const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
    if (!vendor || vendor.pendingPayout.lt(amount)) {
      throw new Error('Insufficient balance')
    }

    return prisma.payout.create({
      data: {
        vendorId,
        amount,
        method,
        status: 'PENDING',
      },
    })
  },

  async getPayouts(vendorId: string) {
    return prisma.payout.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    })
  },

  async getDashboardStats(vendorId: string) {
    const orders = await prisma.vendorOrder.findMany({
      where: { vendorId },
    })

    const pendingOrders = orders.filter(o => o.status === 'PENDING').length
    const shippedOrders = orders.filter(o => o.status === 'SHIPPED').length
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length

    const totalEarnings = orders.reduce((sum, o) => sum + Number(o.earnings), 0)
    const pendingPayout = orders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + Number(o.earnings), 0)

    return {
      totalOrders: orders.length,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      totalEarnings,
      pendingPayout,
    }
  },

  async getAllVendors(status?: string) {
    return prisma.vendor.findMany({
      where: status ? { status: status as any } : undefined,
      include: { user: { select: { email: true, phone: true } } },
      orderBy: { createdAt: 'desc' },
    })
  },

  async approveVendor(vendorId: string) {
    return prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'APPROVED' },
    })
  },

  async rejectVendor(vendorId: string) {
    return prisma.vendor.update({
      where: { id: vendorId },
      data: { status: 'REJECTED' },
    })
  },

  async updateCommission(vendorId: string, rate: number) {
    return prisma.vendor.update({
      where: { id: vendorId },
      data: { commissionRate: rate },
    })
  },
}