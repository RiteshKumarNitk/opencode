import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const protectedPaths = [
  '/api/orders',
  '/api/addresses',
  '/api/auth/me',
  '/api/admin',
];

const adminPaths = ['/api/admin'];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isAdmin = adminPaths.some((path) => pathname.startsWith(path));

  if (!isProtected) return NextResponse.next();

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status: 401 });
  }

  if (isAdmin && payload.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
