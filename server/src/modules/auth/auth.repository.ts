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
}
