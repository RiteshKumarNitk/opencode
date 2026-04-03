import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function createPasswordResetToken(email: string) {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase(), deletedAt: null },
  });
  if (!user) throw new Error('USER_NOT_FOUND');

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  const resetToken = await prisma.passwordResetToken.create({
    data: { token, expiresAt, userId: user.id },
  });

  return { token: resetToken.token, email: user.email, firstName: user.firstName };
}

export async function validateResetToken(token: string) {
  const resetToken = await prisma.passwordResetToken.findFirst({
    where: { token, used: false, expiresAt: { gt: new Date() } },
    include: { user: { select: { id: true, email: true } } },
  });
  if (!resetToken) throw new Error('INVALID_OR_EXPIRED_TOKEN');
  return resetToken;
}

export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await validateResetToken(token);

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);

  return { success: true };
}
