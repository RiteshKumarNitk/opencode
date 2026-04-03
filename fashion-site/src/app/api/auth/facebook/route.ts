import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return new NextResponse('Facebook auth handler', { status: 200 });
}