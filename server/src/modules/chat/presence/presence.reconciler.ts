import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ChatGateway } from '@/modules/chat/chat.gateway';
import { PresenceService } from '@/modules/chat/presence/presence.service';
import { PRESENCE_INTERVAL } from '@/modules/chat/presence/presence.constants';

@Injectable()
export class PresenceReconciler implements OnModuleInit {
  private readonly logger = new Logger(PresenceReconciler.name);
  private running = false;

  constructor(
    private readonly presence: PresenceService,
    private readonly chatGateway: ChatGateway,
  ) {}

  onModuleInit() {
    setTimeout(() => void this.tick(), 5_000);
  }

  @Interval(PRESENCE_INTERVAL.reconcilerMs)
  async tick() {
    if (this.running) return;
    this.running = true;
    try {
      const sockets = await this.chatGateway.fetchAllChatSockets();
      const map = new Map<string, string[]>();
      for (const s of sockets) {
        const uid = s.data?.userId as string | undefined;
        if (!uid) continue;
        const arr = map.get(uid) ?? [];
        arr.push(s.id);
        map.set(uid, arr);
      }

      const { becameOffline } = await this.presence.reconcile(map);

      for (const uid of becameOffline) {
        await this.chatGateway.broadcastOfflineToFriends(uid);
      }
    } catch (e: any) {
      this.logger.error(`Reconciler tick failed: ${e.message}`, e.stack);
    } finally {
      this.running = false;
    }
  }
}
