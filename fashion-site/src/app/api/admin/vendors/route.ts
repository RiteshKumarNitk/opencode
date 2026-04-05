import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const vendors = await prisma.vendor.findMany({
    where: status ? { status: status as any } : undefined,
    include: {
      user: { select: { email: true, phone: true } },
      _count: { select: { products: true, orders: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(vendors)
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { id, action } = body

    if (action === 'approve') {
      const vendor = await prisma.vendor.update({
        where: { id },
        data: { status: 'APPROVED' },
      })
      return Response.json(vendor)
    }

    if (action === 'reject') {
      const vendor = await prisma.vendor.update({
        where: { id },
        data: { status: 'REJECTED' },
      })
      return Response.json(vendor)
    }

    if (action === 'suspend') {
      const vendor = await prisma.vendor.update({
        where: { id },
        data: { status: 'SUSPENDED' },
      })
      return Response.json(vendor)
    }

    if (action === 'updateCommission') {
      const vendor = await prisma.vendor.update({
        where: { id },
        data: { commissionRate: body.rate },
      })
      return Response.json(vendor)
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    return Response.json({ error: 'Failed to process request' }, { status: 500 })
  }
}