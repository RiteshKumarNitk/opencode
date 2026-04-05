import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/modules/analytics/service';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    const { eventType, metadata } = await request.json();

    if (!eventType) {
      return NextResponse.json({ error: 'Event type required' }, { status: 400 });
    }

    const sessionId = request.headers.get('x-session-id') || 
      request.cookies.get('sessionId')?.value;

    await trackEvent({
      eventType,
      userId: user?.userId,
      sessionId,
      metadata,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}