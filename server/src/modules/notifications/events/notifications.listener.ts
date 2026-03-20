import { Injectable } from '@nestjs/common';
import { NotificationQueueService } from '@modules/notifications/queue/notification-queue.service';
import { OnEvent } from '@nestjs/event-emitter';
import type { NotificationPayload } from '@modules/notifications/events/notifications.events';

@Injectable()
export class NotificationListener {
  constructor(private notificationQueue: NotificationQueueService) {}

  @OnEvent('notification.**')
  async handleNotification(payload: NotificationPayload) {
    if (payload.actorId === payload.recipientId) {
      return;
    }

    await this.notificationQueue.addJob(payload);
  }
}
