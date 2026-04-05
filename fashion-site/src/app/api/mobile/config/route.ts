import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const version = searchParams.get('v') || '1';
    
    const appConfig = {
      version: '1.0.0',
      minVersion: '1.0.0',
      apiBaseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
      features: {
        socialLogin: true,
        pushNotifications: true,
        loyaltyPoints: true,
        flashSales: true,
        productBundles: true,
      },
      paymentGateways: {
        razorpay: !!process.env.RAZORPAY_KEY_ID,
        stripe: !!process.env.STRIPE_PUBLISHABLE_KEY,
      },
      support: {
        email: 'support@fashionstore.com',
        phone: '+91-9876543210',
      },
    };
    
    return NextResponse.json(appConfig);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch app config' }, { status: 500 });
  }
}