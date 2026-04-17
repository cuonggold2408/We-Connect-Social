import { useChatStore } from "@/shared/stores/chat.store";
import { useAuthStore } from "@/shared/stores/auth.store";
import { useCallback, useRef } from "react";
import type { Socket } from "socket.io-client";

export function useSendMessage(socketRef: React.RefObject<Socket | null>) {
  const user = useAuthStore((s) => s.user);
  const addMessage = useChatStore((s) => s.addMessage);
  const inflightRef = useRef<Set<string>>(new Set());

  return useCallback(
    (
      conversationId: string,
      content: string,
      options?: {
        type?: "TEXT" | "IMAGE" | "FILE";
        fileUrl?: string;
        fileName?: string;
        fileSize?: number;
        replyToId?: string;
      },
    ) => {
      if (!socketRef.current?.connected || !user) return;

      const tempId = crypto.randomUUID();
      if (inflightRef.current.has(tempId)) return;
      inflightRef.current.add(tempId);

      setTimeout(() => {
        inflightRef.current.delete(tempId);
      }, 30000);

      addMessage(conversationId, {
        id: tempId,
        conversationId,
        content,
        type: options?.type ?? "TEXT",
        fileUrl: options?.fileUrl ?? null,
        fileName: options?.fileName ?? null,
        fileSize: options?.fileSize ?? null,
        replyToId: options?.replyToId ?? null,
        replyTo: null,
        callSessionId: null,
        deletedAt: null,
        sender: {
          id: user.id,
          username: user.username,
          fullname: user.fullName,
          avatarUrl: user.avatarUrl,
        },
        createdAt: new Date().toISOString(),
      });

      socketRef.current.emit("send-message", {
        tempId,
        conversationId,
        content,
        type: options?.type ?? "TEXT",
        fileUrl: options?.fileUrl,
        fileName: options?.fileName,
        fileSize: options?.fileSize,
        replyToId: options?.replyToId,
      });
    },
    [socketRef, user, addMessage],
  );
}
