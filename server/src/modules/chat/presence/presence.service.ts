import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaService } from '@/shared/prisma/prisma.service';
import {
  PRESENCE_KEYS,
  PRESENCE_TTL,
} from '@/modules/chat/presence/presence.constants';

@Injectable()
export class PresenceService implements OnModuleInit {
  private readonly logger = new Logger(PresenceService.name);
  private readonly redis: Redis;
  private readonly pendingLastSeen = new Map<string, Date>();

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.redis = new Redis({
      host: this.config.getOrThrow('REDIS_HOST'),
      port: this.config.getOrThrow<number>('REDIS_PORT'),
    });
  }

  onModuleInit() {
    setInterval(() => void this.flushLastSeenToDb(), 60_000).unref();
  }

  async markOnline(userId: string, socketId: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.sadd(PRESENCE_KEYS.onlineSet, userId);
    pipeline.expire(PRESENCE_KEYS.onlineSet, PRESENCE_TTL.onlineSetSec);
    pipeline.sadd(PRESENCE_KEYS.userSockets(userId), socketId);
    pipeline.expire(
      PRESENCE_KEYS.userSockets(userId),
      PRESENCE_TTL.userSocketsSec,
    );
    pipeline.set(
      PRESENCE_KEYS.socketAlive(socketId),
      userId,
      'EX',
      PRESENCE_TTL.socketAliveSec,
    );
    pipeline.del(PRESENCE_KEYS.lastSeen(userId));
    await pipeline.exec();
  }

  async refreshHeartbeat(userId: string, socketId: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    pipeline.pexpire(
      PRESENCE_KEYS.socketAlive(socketId),
      PRESENCE_TTL.socketAliveSec * 1000,
    );
    pipeline.pexpire(
      PRESENCE_KEYS.userSockets(userId),
      PRESENCE_TTL.userSocketsSec * 1000,
    );
    pipeline.expire(PRESENCE_KEYS.onlineSet, PRESENCE_TTL.onlineSetSec);
    pipeline.sadd(PRESENCE_KEYS.onlineSet, userId);
    await pipeline.exec();
  }

  async markOffline(
    userId: string,
    socketId: string,
  ): Promise<{ fullyOffline: boolean; lastSeen: Date | null }> {
    const pipeline = this.redis.pipeline();
    pipeline.srem(PRESENCE_KEYS.userSockets(userId), socketId);
    pipeline.del(PRESENCE_KEYS.socketAlive(socketId));
    pipeline.scard(PRESENCE_KEYS.userSockets(userId));
    const results = await pipeline.exec();
    const remaining = (results?.[2]?.[1] as number) ?? 0;

    if (remaining > 0) return { fullyOffline: false, lastSeen: null };

    const now = new Date();
    await this.redis
      .multi()
      .srem(PRESENCE_KEYS.onlineSet, userId)
      .set(
        PRESENCE_KEYS.lastSeen(userId),
        now.toISOString(),
        'EX',
        PRESENCE_TTL.lastSeenSec,
      )
      .exec();

    this.pendingLastSeen.set(userId, now);

    return { fullyOffline: true, lastSeen: now };
  }

  async isOnline(userId: string): Promise<boolean> {
    const sockets = await this.redis.smembers(
      PRESENCE_KEYS.userSockets(userId),
    );
    if (sockets.length === 0) return false;

    const pipeline = this.redis.pipeline();
    for (const sid of sockets) {
      pipeline.exists(PRESENCE_KEYS.socketAlive(sid));
    }
    const results = await pipeline.exec();
    const stale = sockets.filter((_, i) => (results?.[i]?.[1] as number) === 0);

    if (stale.length > 0) {
      await this.redis.srem(PRESENCE_KEYS.userSockets(userId), ...stale);
      if (stale.length === sockets.length) {
        await this.redis.srem(PRESENCE_KEYS.onlineSet, userId);
        return false;
      }
    }
    return true;
  }

  async getOnlineUserIdsBulk(userIds: string[]): Promise<Set<string>> {
    if (userIds.length === 0) return new Set();
    const results = await this.redis.smismember(
      PRESENCE_KEYS.onlineSet,
      ...userIds,
    );
    return new Set(userIds.filter((_, i) => results[i] === 1));
  }

  async getLastSeenBulk(
    userIds: string[],
  ): Promise<Map<string, string | null>> {
    if (userIds.length === 0) return new Map();
    const pipeline = this.redis.pipeline();
    for (const uid of userIds) pipeline.get(PRESENCE_KEYS.lastSeen(uid));
    const results = await pipeline.exec();

    const map = new Map<string, string | null>();
    userIds.forEach((uid, i) => {
      map.set(uid, (results?.[i]?.[1] as string | null) ?? null);
    });
    return map;
  }

  async reconcile(liveSocketsByUser: Map<string, string[]>): Promise<{
    becameOffline: string[];
    becameOnline: string[];
  }> {
    const onlineNow = await this.redis.smembers(PRESENCE_KEYS.onlineSet);
    const liveUserIds = new Set(liveSocketsByUser.keys());

    const becameOffline = onlineNow.filter((uid) => !liveUserIds.has(uid));
    const becameOnline = [...liveUserIds].filter(
      (uid) => !onlineNow.includes(uid),
    );

    const pipeline = this.redis.pipeline();
    if (becameOffline.length > 0) {
      pipeline.srem(PRESENCE_KEYS.onlineSet, ...becameOffline);
      const now = new Date().toISOString();
      for (const uid of becameOffline) {
        pipeline.set(
          PRESENCE_KEYS.lastSeen(uid),
          now,
          'EX',
          PRESENCE_TTL.lastSeenSec,
        );
        pipeline.del(PRESENCE_KEYS.userSockets(uid));
        this.pendingLastSeen.set(uid, new Date(now));
      }
    }
    if (becameOnline.length > 0) {
      pipeline.sadd(PRESENCE_KEYS.onlineSet, ...becameOnline);
    }
    pipeline.expire(PRESENCE_KEYS.onlineSet, PRESENCE_TTL.onlineSetSec);
    await pipeline.exec();

    if (becameOffline.length > 0 || becameOnline.length > 0) {
      this.logger.log(
        `Reconciled: +${becameOnline.length} online, -${becameOffline.length} offline`,
      );
    }
    return { becameOffline, becameOnline };
  }

  async getPresenceSnapshot(friendIds: string[]) {
    const [onlineSet, lastSeenMap] = await Promise.all([
      this.getOnlineUserIdsBulk(friendIds),
      this.getLastSeenBulk(friendIds),
    ]);
    return {
      onlineUserIds: [...onlineSet],
      lastSeen: Object.fromEntries(lastSeenMap),
    };
  }

  private async flushLastSeenToDb(): Promise<void> {
    if (this.pendingLastSeen.size === 0) return;
    const batch = new Map(this.pendingLastSeen);
    this.pendingLastSeen.clear();

    try {
      await this.prisma.$transaction(
        [...batch.entries()].map(([userId, ts]) =>
          this.prisma.user.update({
            where: { id: userId },
            data: { lastActiveAt: ts },
          }),
        ),
      );
    } catch (e: any) {
      this.logger.warn(`Flush lastSeen failed: ${e.message}`);
      for (const [uid, ts] of batch) {
        if (!this.pendingLastSeen.has(uid)) this.pendingLastSeen.set(uid, ts);
      }
    }
  }
}
