"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { MessageBubble } from "@/features/messenger/ui/MessageBubble";
import { Loader2 } from "lucide-react";
import type { MessageItem } from "@/shared/api/chat.api";
import { useAuthStore } from "@/shared/stores/auth.store";

interface Props {
  messages: MessageItem[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}

export function MessageList({
  messages,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const currentUserId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    if (
      messages.length > prevLengthRef.current &&
      prevLengthRef.current === 0
    ) {
      bottomRef.current?.scrollIntoView();
    } else if (messages.length > prevLengthRef.current) {
      const container = containerRef.current;
      if (container) {
        const { scrollHeight, scrollTop, clientHeight } = container;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        if (isNearBottom) {
          bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !hasMore || isLoadingMore) return;

    if (container.scrollTop < 100) {
      onLoadMore();
    }
  }, [hasMore, isLoadingMore, onLoadMore]);

  const reversed = [...messages].reverse();

  const lastOwnMessageId = useMemo(() => {
    for (let i = reversed.length - 1; i >= 0; i--) {
      const m = reversed[i];
      if (m.type !== "CALL_LOG" && m.sender.id === currentUserId) {
        return m.id;
      }
    }
    return null;
  }, [reversed, currentUserId]);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-4"
    >
      {isLoadingMore && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      )}

      <div className="flex flex-col gap-1">
        {reversed.map((msg, i) => {
          if (msg.type === "CALL_LOG") {
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                showAvatar={false}
                isLastOwnMessage={false}
              />
            );
          }

          let nextBubble: MessageItem | undefined;
          for (let j = i + 1; j < reversed.length; j++) {
            if (reversed[j].type !== "CALL_LOG") {
              nextBubble = reversed[j];
              break;
            }
          }

          const showAvatar =
            !nextBubble || nextBubble.sender.id !== msg.sender.id;

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              showAvatar={showAvatar}
              isLastOwnMessage={msg.id === lastOwnMessageId}
            />
          );
        })}
      </div>

      <div ref={bottomRef} />
    </div>
  );
}
