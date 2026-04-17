import { useCallback, useRef } from "react";
import type { Socket } from "socket.io-client";

export function useTypingIndicator(
  socketRef: React.RefObject<Socket | null>,
  conversationId: string | null,
) {
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTyping = useRef(false);

  const startTyping = useCallback(() => {
    if (!socketRef.current?.connected || !conversationId) return;

    if (!isTyping.current) {
      isTyping.current = true;
      socketRef.current.emit("typing", { conversationId });
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isTyping.current = false;
      socketRef.current?.emit("stop-typing", { conversationId });
    }, 2000);
  }, [socketRef, conversationId]);

  const stopTyping = useCallback(() => {
    if (!socketRef.current?.connected || !conversationId) return;
    if (isTyping.current) {
      isTyping.current = false;
      socketRef.current.emit("stop-typing", { conversationId });
    }
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
  }, [socketRef, conversationId]);

  return { startTyping, stopTyping };
}
