import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const now = new Date();
    const sales = await prisma.flashSale.findMany({
      where: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
      include: {
        products: {
          include: {
            product: {
              include: {
                variants: { where: { isActive: true }, take: 1 },
              },
            },
          },
        },
      },
      orderBy: { startsAt: 'desc' },
      take: 5,
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error('Error fetching flash sales:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}