"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { chatApi, type ConversationItem } from "@/shared/api/chat.api";
import { useChatStore } from "@/shared/stores/chat.store";

interface Options {
  onSuccess?: (conversationId: string) => void;
  onError?: (error: unknown) => void;
}

export function useStartConversation({ onSuccess, onError }: Options = {}) {
  const upsertConversation = useChatStore((s) => s.upsertConversation);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (targetUserId: string) =>
      chatApi.startConversation(targetUserId),
    onSuccess: (data) => {
      const item: ConversationItem = {
        id: data.id,
        otherUser: data.otherUser,
        lastMessage: null,
        unreadCount: 0,
        isOnline:
          data.isOnline ||
          useChatStore.getState().onlineUsers.has(data.otherUser.id),
        lastMessageAt: null,
        lastSeen:
          useChatStore.getState().lastSeenMap.get(data.otherUser.id) ?? null,
      };

      upsertConversation(item);

      queryClient.setQueryData<ConversationItem[]>(
        ["conversations"],
        (prev) => {
          if (!prev) return [item];
          if (prev.some((c) => c.id === item.id)) return prev;
          return [item, ...prev];
        },
      );

      onSuccess?.(data.id);
    },
    onError,
  });
}
