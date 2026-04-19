import { create } from "zustand";
import type { ConversationItem, MessageItem } from "@/shared/api/chat.api";
import { useAuthStore } from "@/shared/stores/auth.store";

interface ChatStoreState {
  conversations: ConversationItem[];
  activeConversationId: string | null;
  messages: Map<string, MessageItem[]>;
  typingUsers: Map<string, Set<string>>;
  onlineUsers: Set<string>;
}

interface ChatStoreActions {
  setConversations: (list: ConversationItem[]) => void;
  setActiveConversation: (id: string | null) => void;

  updateConversationLastMessage: (
    conversationId: string,
    lastMessage: ConversationItem["lastMessage"],
  ) => void;

  addMessage: (conversationId: string, message: MessageItem) => void;
  setMessages: (conversationId: string, messages: MessageItem[]) => void;
  prependMessages: (conversationId: string, messages: MessageItem[]) => void;

  confirmMessage: (
    tempId: string,
    conversationId: string,
    realMessage: MessageItem,
  ) => void;
  markMessageFailed: (tempId: string, conversationId: string) => void;

  setUserTyping: (conversationId: string, userId: string) => void;
  clearUserTyping: (conversationId: string, userId: string) => void;

  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;

  markConversationRead: (conversationId: string) => void;

  upsertConversation: (conversation: ConversationItem) => void;
}

type ChatStore = ChatStoreState & ChatStoreActions;

export const useChatStore = create<ChatStore>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: new Map(),
  typingUsers: new Map(),
  onlineUsers: new Set(),

  setConversations: (list) => set({ conversations: list }),
  setActiveConversation: (id) => set({ activeConversationId: id }),

  updateConversationLastMessage: (conversationId, lastMessage) =>
    set((state) => ({
      conversations: state.conversations
        .map((c) =>
          c.id === conversationId
            ? {
                ...c,
                lastMessage,
                lastMessageAt: lastMessage?.createdAt ?? c.lastMessageAt,
              }
            : c,
        )
        .sort((a, b) => {
          const at = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bt = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bt - at;
        }),
    })),

  addMessage: (conversationId, message) =>
    set((state) => {
      const current = state.messages.get(conversationId) ?? [];
      if (current.some((m) => m.id === message.id)) return state;

      const isOwnMessage =
        message.sender.id === useAuthStore.getState().user?.id;

      if (isOwnMessage) {
        const fiveSecondsAgo = Date.now() - 5_000;
        const tempIdx = current.findIndex(
          (m) =>
            m.sender.id === message.sender.id &&
            m.type === message.type &&
            m.content === message.content &&
            m.fileUrl === message.fileUrl &&
            new Date(m.createdAt).getTime() >= fiveSecondsAgo &&
            m.id !== message.id,
        );
        if (tempIdx !== -1) {
          const updated = new Map(state.messages);
          const next = [...current];
          next[tempIdx] = message;
          updated.set(conversationId, next);
          return { messages: updated };
        }
      }

      const updated = new Map(state.messages);
      updated.set(conversationId, [message, ...current]);
      return { messages: updated };
    }),

  setMessages: (conversationId, messages) =>
    set((state) => {
      const updated = new Map(state.messages);
      updated.set(conversationId, messages);
      return { messages: updated };
    }),

  prependMessages: (conversationId, older) =>
    set((state) => {
      const current = state.messages.get(conversationId) ?? [];
      const updated = new Map(state.messages);
      updated.set(conversationId, [...current, ...older]);
      return { messages: updated };
    }),

  confirmMessage: (tempId, conversationId, realMessage) =>
    set((state) => {
      const current = state.messages.get(conversationId) ?? [];
      if (current.some((m) => m.id === realMessage.id)) return state;

      const idx = current.findIndex((m) => m.id === tempId);
      if (idx === -1) return state;

      const updated = new Map(state.messages);
      const next = [...current];
      next[idx] = realMessage;
      updated.set(conversationId, next);
      return { messages: updated };
    }),

  markMessageFailed: (tempId, conversationId) =>
    set((state) => {
      const current = state.messages.get(conversationId) ?? [];
      const updated = new Map(state.messages);
      updated.set(
        conversationId,
        current.map((m) =>
          m.id === tempId ? ({ ...m, _failed: true } as MessageItem) : m,
        ),
      );
      return { messages: updated };
    }),

  setUserTyping: (conversationId, userId) =>
    set((state) => {
      const updated = new Map(state.typingUsers);
      const current = new Set(updated.get(conversationId));
      current.add(userId);
      updated.set(conversationId, current);
      return { typingUsers: updated };
    }),

  clearUserTyping: (conversationId, userId) =>
    set((state) => {
      const updated = new Map(state.typingUsers);
      const current = updated.get(conversationId);
      if (current) {
        const next = new Set(current);
        next.delete(userId);
        if (next.size === 0) updated.delete(conversationId);
        else updated.set(conversationId, next);
      }
      return { typingUsers: updated };
    }),

  setUserOnline: (userId) =>
    set((state) => {
      const updated = new Set(state.onlineUsers);
      updated.add(userId);
      return {
        onlineUsers: updated,
        conversations: state.conversations.map((c) =>
          c.otherUser.id === userId ? { ...c, isOnline: true } : c,
        ),
      };
    }),

  setUserOffline: (userId) =>
    set((state) => {
      const updated = new Set(state.onlineUsers);
      updated.delete(userId);
      return {
        onlineUsers: updated,
        conversations: state.conversations.map((c) =>
          c.otherUser.id === userId ? { ...c, isOnline: false } : c,
        ),
      };
    }),

  markConversationRead: (conversationId) =>
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c,
      ),
    })),

  upsertConversation: (conversation) =>
    set((state) => {
      const exists = state.conversations.some((c) => c.id === conversation.id);
      if (exists) {
        return {
          conversations: state.conversations.map((c) =>
            c.id === conversation.id ? { ...c, ...conversation } : c,
          ),
        };
      }
      return { conversations: [conversation, ...state.conversations] };
    }),
}));
