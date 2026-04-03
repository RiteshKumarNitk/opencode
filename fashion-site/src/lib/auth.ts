import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';

// ─── Types ────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
}

// ─── Password ─────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT ──────────────────────────────────────────────────────

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
}

export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET!, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '30d',
  } as jwt.SignOptions);
}

export function generateTokens(user: { id: string; email: string; role: string }) {
  const payload = { userId: user.id, email: user.email, role: user.role as 'ADMIN' | 'CUSTOMER' };
  return {
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
}

// ─── Extract user from request ────────────────────────────────

export async function getUserFromRequest(req: NextRequest): Promise<JwtPayload | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId, isActive: true, deletedAt: null },
    select: { id: true, role: true },
  });

  if (!user) return null;

  return {
    userId: user.id,
    email: payload.email,
    role: user.role as JwtPayload['role'],
  };
}

// ─── Auth guards ──────────────────────────────────────────────

export function requireRole(user: JwtPayload, roles: JwtPayload['role'][]): boolean {
  return roles.includes(user.role);
}
