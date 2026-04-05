import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { vendorService } from '@/modules/vendor/service'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = registerSchema.parse(body)

    const existingVendor = await vendorService.getVendorByUserId(session.user.id)
    if (existingVendor) {
      return NextResponse.json({ error: 'Already registered as vendor' }, { status: 400 })
    }

    const vendor = await vendorService.createVendor({
      userId: session.user.id,
      ...data,
    })

    return NextResponse.json(vendor)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vendor = await vendorService.getVendorByUserId(session.user.id)
    return NextResponse.json(vendor || null)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}