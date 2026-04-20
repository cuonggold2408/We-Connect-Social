import { cn } from "@/shared/lib/utils";
import { useAuthStore } from "@/shared/stores/auth.store";
import { Phone, Video } from "lucide-react";
import type { MessageItem } from "@/shared/api/chat.api";
import Image from "next/image";
import { DEFAULT_AVATAR_URL } from "@/shared/helpers/constants";
import { useChatStore } from "@/shared/stores/chat.store";
import { useMemo } from "react";
import {
  computeMessageStatus,
  STATUS_LABEL,
} from "@/features/messenger/utils/messageStatus";

interface Props {
  message: MessageItem;
  showAvatar: boolean;
  isLastOwnMessage: boolean;
}

export function MessageBubble({
  message,
  showAvatar,
  isLastOwnMessage,
}: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const isMine = message.sender.id === currentUserId;

  const conversation = useChatStore((s) =>
    s.conversations.find((c) => c.id === message.conversationId),
  );
  const peerReadAt = useChatStore((s) =>
    s.peerReadAt.get(message.conversationId),
  );
  const status = useMemo(() => {
    if (!isMine || !conversation) return null;

    const peerId = conversation.otherUser.id;
    return computeMessageStatus({
      message,
      peerId,
      peerLastReadAt: peerReadAt?.get(peerId) ?? null,
      isPeerOnline: conversation.isOnline,
    });
  }, [isMine, conversation, message, peerReadAt]);

  if (message.type === "CALL_LOG") {
    return (
      <div className="flex justify-center py-2">
        <div className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-1.5 text-xs text-gray-500">
          {message.content?.includes("video") ? (
            <Video className="h-3.5 w-3.5" />
          ) : (
            <Phone className="h-3.5 w-3.5" />
          )}
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  const time = new Date(message.createdAt).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex flex-col", isMine ? "items-end" : "items-start")}>
      <div
        className={cn(
          "flex items-end gap-2",
          isMine ? "flex-row-reverse" : "flex-row",
        )}
      >
        {!isMine && showAvatar ? (
          <Image
            src={message.sender.avatarUrl ?? DEFAULT_AVATAR_URL}
            alt={message.sender.fullname ?? message.sender.username}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
            width={32}
            height={32}
            priority
          />
        ) : (
          !isMine && <div className="w-8 shrink-0" />
        )}

        <div
          className={cn(
            "group relative max-w-md rounded-2xl px-4 py-2.5",
            isMine
              ? "bg-blue-primary rounded-br-md text-white"
              : "rounded-bl-md bg-gray-100 text-gray-900",
          )}
        >
          {message.replyTo && (
            <div
              className={cn(
                "mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs",
                isMine
                  ? "border-white/50 bg-white/10 text-white/80"
                  : "border-gray-300 bg-white text-gray-500",
              )}
            >
              <p className="font-medium">{message.replyTo.sender.fullname}</p>
              <p className="truncate">{message.replyTo.content}</p>
            </div>
          )}

          {message.type === "IMAGE" && message.fileUrl && (
            <Image
              src={message.fileUrl}
              alt={message.sender.fullname ?? message.sender.username}
              className="mb-1 max-h-60 rounded-lg object-cover"
              width={320}
              height={240}
              priority
            />
          )}

          {message.content && (
            <p className="wrap-break-words text-sm whitespace-pre-wrap">
              {message.content}
            </p>
          )}

          <div
            className={cn(
              "mt-1 flex items-center gap-1",
              isMine ? "justify-end" : "justify-start",
            )}
          >
            <span
              className={cn(
                "text-[10px]",
                isMine ? "text-white/70" : "text-gray-400",
              )}
            >
              {time}
            </span>
          </div>
        </div>
      </div>

      {isMine && isLastOwnMessage && status && (
        <span
          className={cn(
            "mt-0.5 mr-1 text-[11px] leading-none select-none",
            status === "failed" ? "text-red-500" : "text-gray-400",
          )}
          aria-live="polite"
          role="status"
        >
          {STATUS_LABEL[status]}
          {status === "pending" && (
            <span className="ml-1 inline-block animate-pulse">·</span>
          )}
        </span>
      )}
    </div>
  );
}
