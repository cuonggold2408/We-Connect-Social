import { Injectable } from '@nestjs/common';
import { NotificationQueueService } from '@modules/notifications/queue/notification-queue.service';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AGGREGATABLE_NOTIFICATION_TYPES,
  type NotificationPayload,
} from '@modules/notifications/events/notifications.events';

@Injectable()
export class NotificationListener {
  constructor(private notificationQueueService: NotificationQueueService) {}

  @OnEvent('notification.**')
  async handleNotification(payload: NotificationPayload) {
    if (payload.actorId === payload.recipientId) {
      return;
    }

    if (AGGREGATABLE_NOTIFICATION_TYPES.has(payload.type)) {
      await this.notificationQueueService.addAggregationJob(payload);
    } else {
      await this.notificationQueueService.addImmediateJob(payload);
    }
  }
}
