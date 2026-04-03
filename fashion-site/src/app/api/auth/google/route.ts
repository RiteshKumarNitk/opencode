import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/login?error=social_auth_not_configured', req.url));
}