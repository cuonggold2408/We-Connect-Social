import { NotificationType } from '@/generated/prisma/enums';

export const NOTIFICATION_EVENTS = {
  POST_REACTED: 'notification.post.reacted',
  POST_COMMENTED: 'notification.post.commented',
  COMMENT_REPLIED: 'notification.comment.replied',
  COMMENT_REACTED: 'notification.comment.reacted',
  FRIEND_REQUESTED: 'notification.friend.requested',
  FRIEND_ACCEPTED: 'notification.friend.accepted',
} as const;

export const AGGREGATABLE_NOTIFICATION_TYPES = new Set<NotificationType>([
  NotificationType.POST_REACTION,
  NotificationType.COMMENT_REACTION,
]);

export interface NotificationPayload {
  actorId: string;
  recipientId: string;
  type: NotificationType;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
}

export enum NotificationEntityType {
  POST = 'POST',
  REPLY = 'REPLY',
  FRIEND = 'FRIEND',
}

export interface NotificationSocketData {
  id: string;
  type: NotificationType;
  actors: ActorSnapshot[];
  actorCount: number;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any>;
  isRead: boolean;
  createdAt: Date;
}

export interface AggregationJobData {
  recipientId: string;
  type: NotificationType;
  entityType: string;
  entityId: string;
  bufferKey: string;
  metadata?: Record<string, any>;
}

export interface ActorSnapshot {
  id: string;
  username: string;
  fullname: string | null;
  avatarUrl: string | null;
}
