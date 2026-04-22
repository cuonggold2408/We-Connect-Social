import { cn } from "@/shared/lib/utils";
import { timeAgo } from "@/shared/helpers/format-time";
import { useAuthStore } from "@/shared/stores/auth.store";
import type { ConversationItem as ConversationType } from "@/shared/api/chat.api";
import Image from "next/image";
import { DEFAULT_AVATAR_URL } from "@/shared/helpers/constants";

interface Props {
  conversation: ConversationType;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationItem({ conversation, isSelected, onClick }: Props) {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { otherUser, lastMessage, unreadCount, isOnline } = conversation;

  const displayName = otherUser.fullname ?? otherUser.username;

  const lastMessagePreview = (() => {
    if (!lastMessage) return "Bắt đầu trò chuyện";

    const isMine = lastMessage.senderId === currentUserId;

    let preview: string;
    if (lastMessage.type === "IMAGE") {
      preview = isMine ? "Bạn đã gửi một hình ảnh" : "Đã gửi một hình ảnh";
      return preview;
    }
    if (lastMessage.type === "CALL_LOG") {
      return lastMessage.content?.trim() || "Cuộc gọi";
    }

    preview = lastMessage.content?.trim() || "Đã gửi một tin nhắn";
    return isMine ? `Bạn: ${preview}` : preview;
  })();

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
        isSelected && "bg-blue-50",
      )}
    >
      <div className="relative shrink-0">
        <Image
          src={otherUser.avatarUrl ?? DEFAULT_AVATAR_URL}
          alt={displayName}
          className="h-12 w-12 rounded-full object-cover"
          width={48}
          height={48}
          priority
        />
        {isOnline && (
          <span className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              "truncate text-sm font-semibold text-gray-900",
              unreadCount > 0 && "text-blue-primary",
            )}
          >
            {displayName}
          </span>
          {lastMessage && (
            <span className="shrink-0 text-xs text-gray-400">
              {timeAgo(lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <p
            className={cn(
              "truncate text-sm text-gray-500",
              unreadCount > 0 && "font-semibold text-gray-900",
            )}
          >
            {lastMessagePreview}
          </p>
          {unreadCount > 0 && (
            <span className="bg-blue-primary ml-2 flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
