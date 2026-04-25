"use client";

import { MessageInput } from "@/features/messenger/ui/MessageInput";
import { TypingIndicator } from "@/features/messenger/ui/TypingIndicator";
import { useMessages } from "@/features/messenger/hooks/useMessages";
import { useSendMessage } from "@/features/messenger/hooks/useSendMessage";
import { useChatStore } from "@/shared/stores/chat.store";
import { useEffect, useMemo } from "react";
import type { Socket } from "socket.io-client";
import { ChatHeader } from "@/features/messenger/ui/ChatHeader";
import { MessageList } from "@/features/messenger/ui/MessageList";
import { useTypingIndicator } from "@/features/messenger/hooks/useTypingIndicator";

interface Props {
  conversationId: string;
  chatSocketRef: React.RefObject<Socket | null>;
  callSocketRef: React.RefObject<Socket | null>;
}

export function ChatPanel({
  conversationId,
  chatSocketRef,
  callSocketRef,
}: Props) {
  const conversations = useChatStore((s) => s.conversations);
  const messages = useChatStore((s) => s.messages);
  const typingUsers = useChatStore((s) => s.typingUsers);

  const conversation = useMemo(
    () => conversations.find((c) => c.id === conversationId),
    [conversations, conversationId],
  );

  const { fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessages(conversationId);

  const sendMessage = useSendMessage(chatSocketRef);
  const { startTyping, stopTyping } = useTypingIndicator(
    chatSocketRef,
    conversationId,
  );

  const conversationMessages = messages.get(conversationId) ?? [];
  const conversationTyping = typingUsers.get(conversationId);

  useEffect(() => {
    const markIfVisible = () => {
      if (
        document.visibilityState === "visible" &&
        chatSocketRef.current?.connected
      ) {
        chatSocketRef.current.emit("mark-seen", { conversationId });
        useChatStore.getState().markConversationRead(conversationId);
      }
    };

    markIfVisible();
    document.addEventListener("visibilitychange", markIfVisible);
    return () =>
      document.removeEventListener("visibilitychange", markIfVisible);
  }, [conversationId, chatSocketRef, conversationMessages.length]);

  if (!conversation) return null;

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        otherUser={conversation.otherUser}
        isOnline={conversation.isOnline}
        callSocketRef={callSocketRef}
        conversationId={conversationId}
      />

      <MessageList
        key={`list-${conversationId}`}
        messages={conversationMessages}
        hasMore={!!hasNextPage}
        isLoadingMore={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
      />

      {conversationTyping && conversationTyping.size > 0 && <TypingIndicator />}

      <MessageInput
        key={`input-${conversationId}`}
        conversationId={conversationId}
        onSend={(content, options) =>
          sendMessage(conversationId, content, options)
        }
        onTyping={startTyping}
        onStopTyping={stopTyping}
      />
    </div>
  );
}
