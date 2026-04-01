import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { FriendshipStatus } from '@/generated/prisma/client';

@Injectable()
export class FriendshipsRepository {
  constructor(private prisma: PrismaService) {}

  private readonly userSelect = {
    id: true,
    username: true,
    fullname: true,
    avatarUrl: true,
  } as const;

  static buildPairKey(userA: string, userB: string): string {
    return userA < userB ? `${userA}:${userB}` : `${userB}:${userA}`;
  }

  async create(senderId: string, receiverId: string) {
    return this.prisma.friendship.create({
      data: {
        senderId,
        receiverId,
        status: FriendshipStatus.PENDING,
        pairKey: FriendshipsRepository.buildPairKey(senderId, receiverId),
      },
      include: {
        sender: { select: this.userSelect },
        receiver: { select: this.userSelect },
      },
    });
  }

  async findBetweenUsers(userA: string, userB: string) {
    const pairKey = FriendshipsRepository.buildPairKey(userA, userB);
    return this.prisma.friendship.findUnique({
      where: { pairKey },
      include: {
        sender: { select: this.userSelect },
        receiver: { select: this.userSelect },
      },
    });
  }

  async transitionStatus(
    id: string,
    expectedStatus: FriendshipStatus,
    newStatus: FriendshipStatus,
    extra?: { acceptedAt?: Date },
  ) {
    return this.prisma.friendship.updateMany({
      where: { id, status: expectedStatus },
      data: {
        status: newStatus,
        updatedAt: new Date(),
        ...(extra?.acceptedAt && { acceptedAt: extra.acceptedAt }),
      },
    });
  }

  async delete(id: string) {
    return this.prisma.friendship.delete({ where: { id } });
  }

  async deleteIfStatus(id: string, expectedStatus: FriendshipStatus) {
    return this.prisma.friendship.deleteMany({
      where: { id, status: expectedStatus },
    });
  }

  async findReceivedRequests(userId: string, cursor?: string, limit = 20) {
    return this.prisma.friendship.findMany({
      where: { receiverId: userId, status: FriendshipStatus.PENDING },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: this.userSelect } },
    });
  }

  async findSentRequests(userId: string, cursor?: string, limit = 20) {
    return this.prisma.friendship.findMany({
      where: { senderId: userId, status: FriendshipStatus.PENDING },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { createdAt: 'desc' },
      include: { receiver: { select: this.userSelect } },
    });
  }

  async findFriends(userId: string, cursor?: string, limit = 20) {
    return this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      orderBy: { acceptedAt: 'desc' },
      include: {
        sender: { select: this.userSelect },
        receiver: { select: this.userSelect },
      },
    });
  }

  async countFriends(userId: string): Promise<number> {
    return this.prisma.friendship.count({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
    });
  }

  async countPendingReceived(userId: string): Promise<number> {
    return this.prisma.friendship.count({
      where: { receiverId: userId, status: FriendshipStatus.PENDING },
    });
  }

  async getFriendIds(userId: string): Promise<string[]> {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: FriendshipStatus.ACCEPTED,
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      select: { senderId: true, receiverId: true },
    });

    return friendships.map((f) =>
      f.senderId === userId ? f.receiverId : f.senderId,
    );
  }
}
