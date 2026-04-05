import { NextRequest, NextResponse } from 'next/server'
import { vendorService } from '@/modules/vendor/service'

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const vendor = await vendorService.getVendorBySlug(params.slug)
    if (!vendor) {
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }
    return NextResponse.json(vendor)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}