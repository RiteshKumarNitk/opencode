import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import * as adminService from '@/modules/admin/service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const active = new URL(request.url).searchParams.get('active') === 'true';
    const subscribers = await adminService.listNewsletterSubscribers(active);
    return NextResponse.json(subscribers);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await request.json();
    if (body.email) {
      const subscriber = await adminService.addNewsletterSubscriber(body.email);
      return NextResponse.json(subscriber, { status: 201 });
    }
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add subscriber' }, { status: 500 });
  }
}