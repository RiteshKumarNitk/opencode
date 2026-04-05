import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    const { action, email, password, firstName, lastName, phone, fcmToken, socialProvider, socialToken } = await req.json();

    if (action === 'register') {
      if (!email || !password || !firstName) {
        return errorResponse('Missing required fields', 400);
      }

      const existing = await prisma.user.findFirst({
        where: { email: { equals: email }, deletedAt: null },
      });

      if (existing) {
        return errorResponse('Email already registered', 400);
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName: lastName || '',
          phone: phone || '',
          role: 'CUSTOMER',
        },
        select: { id: true, email: true, firstName: true, lastName: true, phone: true, role: true },
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      return successResponse({ user, token });
    }

    if (action === 'login') {
      const user = await prisma.user.findFirst({
        where: { email: { equals: email }, deletedAt: null, isActive: true },
      });

      if (!user) {
        return errorResponse('Invalid credentials', 401);
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return errorResponse('Invalid credentials', 401);
      }

      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
      };

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '30d' }
      );

      if (fcmToken) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }

      return successResponse({ user: userData, token });
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    console.error('Mobile auth error:', error);
    return errorResponse('Authentication failed', 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      return errorResponse('Unauthorized', 401);
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, email: true, firstName: true, lastName: true, phone: true, avatar: true, role: true },
    });

    return successResponse(userData);
  } catch (error) {
    return errorResponse('Failed to get user', 500);
  }
}