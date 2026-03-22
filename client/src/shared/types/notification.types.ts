export const NotificationType = {
  POST_REACTION: "POST_REACTION",
  POST_COMMENT: "POST_COMMENT",
  COMMENT_REPLY: "COMMENT_REPLY",
  COMMENT_REACTION: "COMMENT_REACTION",
  FRIEND_REQUEST: "FRIEND_REQUEST",
  FRIEND_ACCEPTED: "FRIEND_ACCEPTED",
} as const;

export type NotificationTypeValue =
  (typeof NotificationType)[keyof typeof NotificationType];

export enum NotificationEntityType {
  POST = "POST",
  REPLY = "REPLY",
  FRIEND = "FRIEND",
}

export interface NotificationActor {
  id: string;
  username: string;
  fullname: string;
  avatarUrl: string;
}

export interface Notification {
  id: string;
  type: NotificationTypeValue;
  actor: NotificationActor;
  entityType: NotificationEntityType;
  entityId: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}
