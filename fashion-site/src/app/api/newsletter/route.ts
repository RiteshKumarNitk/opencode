import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Valid email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (!existing.isActive) {
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { isActive: true, unsubscribedAt: null },
        });
        return new Response(JSON.stringify({ success: true, message: 'Welcome back!' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ error: 'Already subscribed' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await prisma.newsletterSubscriber.create({
      data: { email },
    });

    return new Response(JSON.stringify({ success: true, message: 'Subscribed successfully!' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Newsletter error:', error);
    return new Response(JSON.stringify({ error: 'Failed to subscribe' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const email = url.searchParams.get('email');

  if (!email) {
    return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 });
  }

  const subscriber = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (!subscriber?.isActive) {
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 });
  }

  return new Response(JSON.stringify({ subscribed: true }), { status: 200 });
}