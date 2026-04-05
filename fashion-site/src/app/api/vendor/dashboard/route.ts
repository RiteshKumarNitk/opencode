import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { vendorService } from '@/modules/vendor/service'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendor = await vendorService.getVendorByUserId(session.user.id)
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const stats = await vendorService.getDashboardStats(vendor.id)
    const orders = await vendorService.getVendorOrders(vendor.id)
    const payouts = await vendorService.getPayouts(vendor.id)

    return NextResponse.json({ vendor, stats, orders, payouts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendor = await vendorService.getVendorByUserId(session.user.id)
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    const body = await req.json()
    const { action, ...data } = body

    if (action === 'updateOrderStatus') {
      const updated = await vendorService.updateOrderStatus(data.orderId, data.status)
      return NextResponse.json(updated)
    }

    if (action === 'requestPayout') {
      const payout = await vendorService.requestPayout(vendor.id, data.amount, data.method)
      return NextResponse.json(payout)
    }

    if (action === 'addProduct') {
      await vendorService.addProduct(vendor.id, data.productId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}