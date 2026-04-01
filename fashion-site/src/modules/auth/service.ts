import prisma from '@/lib/prisma';
import {
  hashPassword,
  comparePassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/lib/auth';
import type { RegisterInput, LoginInput, AuthResponse, AuthUser } from './types';

// ─── Register ─────────────────────────────────────────────────

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      phone: input.phone,
      role: 'CUSTOMER',
    },
  });

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    user: mapUser(user),
    accessToken,
    refreshToken,
  };
}

// ─── Login ────────────────────────────────────────────────────

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase(), isActive: true, deletedAt: null },
  });

  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }

  const isValidPassword = await comparePassword(input.password, user.passwordHash);
  if (!isValidPassword) {
    throw new Error('INVALID_CREDENTIALS');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    user: mapUser(user),
    accessToken,
    refreshToken,
  };
}

// ─── Refresh Token ────────────────────────────────────────────

export async function refreshAccessToken(token: string): Promise<{ accessToken: string }> {
  const payload = verifyRefreshToken(token);
  if (!payload) {
    throw new Error('INVALID_REFRESH_TOKEN');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId, isActive: true, deletedAt: null },
  });

  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }

  return {
    accessToken: generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    }),
  };
}

// ─── Get current user ─────────────────────────────────────────

export async function getCurrentUser(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId, isActive: true, deletedAt: null },
  });

  return user ? mapUser(user) : null;
}

// ─── Helpers ──────────────────────────────────────────────────

function mapUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as AuthUser['role'],
    avatar: user.avatar,
  };
}
