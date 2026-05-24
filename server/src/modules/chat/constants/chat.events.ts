export const CHAT_EVENTS = {
  SEND_MESSAGE: 'send-message',
  MARK_SEEN: 'mark-seen',
  TYPING: 'typing',
  STOP_TYPING: 'stop-typing',

  NEW_MESSAGE: 'new-message',
  MESSAGE_ACK: 'message-ack',
  MESSAGE_ERROR: 'message-error',
  MESSAGES_SEEN: 'messages-seen',

  USER_TYPING: 'user-typing',
  USER_STOP_TYPING: 'user-stop-typing',
  USER_ONLINE: 'user-online',
  USER_OFFLINE: 'user-offline',

  CONVERSATION_UPDATED: 'conversation-updated',
  CONVERSATION_CREATED: 'conversation-created',

  AUTH_ERROR: 'auth-error',

  HEARTBEAT: 'heartbeat',
  HEARTBEAT_ACK: 'heartbeat-ack',
  PRESENCE_SNAPSHOT: 'presence-snapshot',
} as const;

export interface SendMessagePayload {
  tempId: string;
  conversationId: string;
  content?: string;
  type?: 'TEXT' | 'IMAGE' | 'FILE';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
}

export interface MarkSeenPayload {
  conversationId: string;
}

export interface TypingPayload {
  conversationId: string;
}
