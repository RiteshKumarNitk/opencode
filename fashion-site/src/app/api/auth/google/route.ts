import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;

async function handleGoogleAuth(code: string, baseUrl: string) {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID!,
      client_secret: GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${baseUrl}/api/auth/google`,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return null;

  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  return userRes.json();
}

async function handleFacebookAuth(code: string, baseUrl: string) {
  const tokenRes = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
    method: 'GET',
    body: new URLSearchParams({
      code,
      client_id: FACEBOOK_APP_ID!,
      client_secret: FACEBOOK_APP_SECRET!,
      redirect_uri: `${baseUrl}/api/auth/facebook`,
    }),
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) return null;

  const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`);
  const fbUser = await userRes.json();
  
  return {
    email: fbUser.email || `${fbUser.id}@facebook.com`,
    name: fbUser.name,
    picture: fbUser.picture?.data?.url,
    id: fbUser.id,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const provider = req.nextUrl.pathname.includes('google') ? 'google' : 'facebook';
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  if (!code) {
    const redirectUri = `${baseUrl}/api/auth/${provider}`;
    
    if (provider === 'google') {
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=openid email profile&state=${Date.now()}`;
      return NextResponse.redirect(authUrl);
    } else {
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${redirectUri}&scope=email,public_profile&state=${Date.now()}`;
      return NextResponse.redirect(authUrl);
    }
  }

  try {
    let userData: { email: string; name: string; picture?: string; id: string } | null;

    if (provider === 'google') {
      userData = await handleGoogleAuth(code, baseUrl);
    } else {
      userData = await handleFacebookAuth(code, baseUrl);
    }

    if (!userData) {
      return NextResponse.redirect(`${baseUrl}/login?error=${provider}_auth_failed`);
    }

    let user = await prisma.user.findFirst({ where: { email: userData.email } });

    if (!user) {
      const nameParts = userData.name.split(' ');
      user = await prisma.user.create({
        data: {
          email: userData.email,
          firstName: nameParts[0] || 'User',
          lastName: nameParts.slice(1).join(' ') || '',
          avatar: userData.picture,
          passwordHash: await bcrypt.hash(Math.random().toString(36), 10),
          role: 'CUSTOMER',
        },
      });
    }

    await prisma.socialAccount.upsert({
      where: { provider_providerId: { provider, providerId: userData.id } },
      create: { userId: user.id, provider, providerId: userData.id },
      update: { userId: user.id },
    });

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    return NextResponse.redirect(`${baseUrl}/?token=${token}&social=success`);
  } catch (error) {
    console.error('Social auth error:', error);
    return NextResponse.redirect(`${baseUrl}/login?error=social_auth_failed`);
  }
}