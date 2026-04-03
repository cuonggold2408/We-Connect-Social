import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/prisma/prisma.service';
import { FriendshipStatus } from '@/generated/prisma/client';

/*
FoF - Friend of Friend
*/
export interface FoFSuggestion {
  id: string;
  username: string;
  fullname: string | null;
  avatarUrl: string | null;
  mutualCount: number;
}

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

  async findFoFSuggestions(
    userId: string,
    limit: number,
  ): Promise<FoFSuggestion[]> {
    return this.prisma.$queryRaw<FoFSuggestion[]>`
      WITH my_friends AS (
        SELECT CASE
          WHEN sender_id = ${userId}::uuid THEN receiver_id
          ELSE sender_id
        END AS friend_id
        FROM friendships
        WHERE status = 'ACCEPTED'::"friendship_status"
          AND (sender_id = ${userId}::uuid OR receiver_id = ${userId}::uuid)
      ),
      existing_relations AS (
        SELECT CASE
          WHEN sender_id = ${userId}::uuid THEN receiver_id
          ELSE sender_id
        END AS related_id
        FROM friendships
        WHERE sender_id = ${userId}::uuid OR receiver_id = ${userId}::uuid
      ),
      fof AS (
        SELECT
          CASE
            WHEN f.sender_id = mf.friend_id THEN f.receiver_id
            ELSE f.sender_id
          END AS suggested_id,
          COUNT(*)::int AS mutual_count
        FROM friendships f
        JOIN my_friends mf
          ON f.status = 'ACCEPTED'::"friendship_status"
          AND (f.sender_id = mf.friend_id OR f.receiver_id = mf.friend_id)
        GROUP BY suggested_id
      )
      SELECT
        fof.suggested_id AS "id",
        fof.mutual_count AS "mutualCount",
        u.username,
        u.fullname,
        u.avatar_url AS "avatarUrl"
      FROM fof
      JOIN users u ON u.id = fof.suggested_id
        AND u.status = 'ACTIVE'::"user_status"
      WHERE fof.suggested_id NOT IN (SELECT related_id FROM existing_relations)
        AND fof.suggested_id != ${userId}::uuid
      ORDER BY fof.mutual_count DESC
      LIMIT ${limit}
    `;
  }

  async findRandomActiveUsers(
    userId: string,
    limit: number,
  ): Promise<FoFSuggestion[]> {
    return this.prisma.$queryRaw<FoFSuggestion[]>`
      SELECT
        u.id,
        u.username,
        u.fullname,
        u.avatar_url AS "avatarUrl",
        0 AS "mutualCount"
      FROM users u
      WHERE u.status = 'ACTIVE'::"user_status"
        AND u.id != ${userId}::uuid
        AND u.id NOT IN (
          SELECT CASE
            WHEN sender_id = ${userId}::uuid THEN receiver_id
            ELSE sender_id
          END
          FROM friendships
          WHERE sender_id = ${userId}::uuid OR receiver_id = ${userId}::uuid
        )
      ORDER BY RANDOM()
      LIMIT ${limit}
    `;
  }
}
