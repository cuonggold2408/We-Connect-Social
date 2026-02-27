import { User } from '@/generated/prisma/client';
import { PrismaService } from '@/shared/prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async updateEmailVerified(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async createRefreshToken(data: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    deviceInfo?: string;
    ipAddress?: string;
  }): Promise<void> {
    await this.prisma.accessUser.create({ data });
  }

  async findValidRefreshToken(refreshToken: string) {
    return this.prisma.accessUser.findFirst({
      where: {
        refreshToken,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async revokeRefreshToken(tokenId: string): Promise<void> {
    await this.prisma.accessUser.update({
      where: {
        id: tokenId,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async revokeAllRefreshToken(userId: string): Promise<void> {
    await this.prisma.accessUser.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  async findByEmailForUpdate(tx: any, email: string): Promise<User | null> {
    const users = (await tx.$queryRaw<User[]>`
      SELECT id, username, email, password,
             fullname, avatar_url AS "avatarUrl", bio, gender, birthday, address,
             email_verified_at AS "emailVerifiedAt",
             is_verified_badge AS "isVerifiedBadge",
             status,
             failed_login_attempts AS "failedLoginAttempts",
             locked_until AS "lockedUntil",
             last_active_at AS "lastActiveAt",
             created_at AS "createdAt",
             updated_at AS "updatedAt"
      FROM users WHERE email = ${email} FOR UPDATE
    `) as Array<User>;

    return users[0] ?? null;
  }
  async incrementFailedAttempts(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
    });
  }
  async lockAccount(userId: string, lockedUntil: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { lockedUntil },
    });
  }
  async permanentlyLockAccount(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BANNED' },
    });
  }
  async resetFailedAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  async createPasswordResetToken(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.passwordReset.create({ data });
  }

  async findValidPasswordResetToken(token: string) {
    return this.prisma.passwordReset.findFirst({
      where: {
        token,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });
  }

  async countRecentPasswordResetTokens(
    userId: string,
    windowMs: number,
  ): Promise<number> {
    return this.prisma.passwordReset.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - windowMs) },
      },
    });
  }
}
