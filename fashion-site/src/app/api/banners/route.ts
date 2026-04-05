import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const position = searchParams.get('position') || 'home';
    
    const banners = await prisma.banner.findMany({
      where: {
        position,
        isActive: true,
        OR: [
          { startsAt: null, expiresAt: null },
          { startsAt: { lte: new Date() }, expiresAt: null },
          { startsAt: null, expiresAt: { gte: new Date() } },
          { startsAt: { lte: new Date() }, expiresAt: { gte: new Date() } },
        ],
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: 5,
    });

    return NextResponse.json(banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Failed to fetch banners' }, { status: 500 });
  }
}