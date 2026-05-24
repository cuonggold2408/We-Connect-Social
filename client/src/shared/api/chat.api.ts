import { api } from "@/shared/api/axios";

export interface ConversationItem {
  id: string;
  otherUser: {
    id: string;
    username: string;
    fullname: string | null;
    avatarUrl: string | null;
    lastActiveAt: string | null;
  };
  lastMessage: {
    id: string;
    content: string | null;
    type: string;
    senderName: string | null;
    senderId: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  isOnline: boolean;
  lastMessageAt: string | null;
  lastSeen: string | null;
}

export interface PresenceSnapshot {
  onlineUserIds: string[];
  lastSeen: Record<string, string | null>;
}

export interface MessageItem {
  id: string;
  conversationId: string;
  content: string | null;
  type: string;
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  replyToId: string | null;
  replyTo: {
    id: string;
    content: string | null;
    sender: { id: string; fullname: string | null };
  } | null;
  sender: {
    id: string;
    username: string;
    fullname: string | null;
    avatarUrl: string | null;
  };
  callSessionId: string | null;
  createdAt: string;
  deletedAt: string | null;
}

export interface CreatedConversation {
  id: string;
  otherUser: ConversationItem["otherUser"];
  isOnline: boolean;
  createdAt: string;
}

interface MessagesResponse {
  data: MessageItem[];
  readStatus: { userId: string; lastReadAt: string | null }[];
  nextCursor: string | null;
}

export const chatApi = {
  getConversations: async (): Promise<ConversationItem[]> => {
    const res = await api.get("/chat/conversations");
    return res.data.data;
  },

  getOrCreateConversation: async (targetUserId: string) => {
    const res = await api.post("/chat/conversations", { targetUserId });
    return res.data.data;
  },

  getMessages: async (
    conversationId: string,
    cursor?: string,
    limit = 30,
  ): Promise<MessagesResponse> => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    params.set("limit", String(limit));
    const res = await api.get(
      `/chat/conversations/${conversationId}/messages?${params}`,
    );
    return res.data.data;
  },

  getOnlineFriends: async (): Promise<string[]> => {
    const res = await api.get("/chat/online-friends");
    return res.data.data;
  },

  startConversation: async (
    targetUserId: string,
  ): Promise<CreatedConversation> => {
    const res = await api.post("/chat/conversations", { targetUserId });
    return res.data.data;
  },

  getPresenceSnapshot: async (): Promise<PresenceSnapshot> => {
    const res = await api.get("/chat/online-friends");
    return res.data.data;
  },
};
