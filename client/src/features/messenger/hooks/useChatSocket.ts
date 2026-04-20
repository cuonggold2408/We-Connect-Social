import { chatApi } from "@/shared/api/chat.api";
import { useAuthStore } from "@/shared/stores/auth.store";
import { useChatStore } from "@/shared/stores/chat.store";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useChatSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) return;
    if (socketRef.current?.connected) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/chat`, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("new-message", ({ message }) => {
      const store = useChatStore.getState();
      const currentUserId = useAuthStore.getState().user?.id;

      store.addMessage(message.conversationId, message);
      store.updateConversationLastMessage(message.conversationId, {
        id: message.id,
        content: message.content,
        type: message.type,
        senderName: message.sender.fullname,
        senderId: message.sender.id,
        createdAt: message.createdAt,
      });

      const isOwnMessage = message.sender.id === currentUserId;
      const isViewingThisConversation =
        store.activeConversationId === message.conversationId &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible";
      if (!isOwnMessage && !isViewingThisConversation) {
        store.incrementUnread(message.conversationId);
      }
    });

    socket.on("message-ack", ({ tempId, message }) => {
      useChatStore
        .getState()
        .confirmMessage(tempId, message.conversationId, message);
      useChatStore
        .getState()
        .updateConversationLastMessage(message.conversationId, {
          id: message.id,
          content: message.content,
          type: message.type,
          senderName: message.sender.fullname,
          senderId: message.sender.id,
          createdAt: message.createdAt,
        });
    });

    socket.on("message-error", ({ tempId }) => {
      const activeId = useChatStore.getState().activeConversationId;
      if (activeId) {
        useChatStore.getState().markMessageFailed(tempId, activeId);
      }
    });

    socket.on("messages-seen", ({ conversationId, userId, seenAt }) => {
      useChatStore.getState().updatePeerReadAt(conversationId, userId, seenAt);
    });

    socket.on("user-typing", ({ conversationId, userId }) => {
      useChatStore.getState().setUserTyping(conversationId, userId);
    });

    socket.on("user-stop-typing", ({ conversationId, userId }) => {
      useChatStore.getState().clearUserTyping(conversationId, userId);
    });

    socket.on("user-online", ({ userId }) => {
      useChatStore.getState().setUserOnline(userId);
    });

    socket.on("user-offline", ({ userId }) => {
      useChatStore.getState().setUserOffline(userId);
    });

    socket.on("auth-error", () => {
      socket.disconnect();
      socketRef.current = null;
    });

    socket.on("conversation-created", () =>
      queryClient.invalidateQueries({ queryKey: ["conversations"] }),
    );

    socket.on("connect", async () => {
      const onlineIds = await chatApi.getOnlineFriends();
      const setOnline = useChatStore.getState().setUserOnline;
      onlineIds.forEach(setOnline);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, queryClient]);

  return socketRef;
}
