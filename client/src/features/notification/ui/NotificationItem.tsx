import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { formatTimeAgo } from "@/shared/helpers/format-time";
import { cn } from "@/shared/lib/utils";
import type { Notification } from "@/shared/types/notification.types";
import {
  ThumbsUp,
  MessageCircle,
  Reply,
  UserPlus,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NotificationMeta {
  action: string;
  Icon: LucideIcon;
  iconBg: string;
}

const NOTIFICATION_META: Record<string, NotificationMeta> = {
  POST_REACTION: {
    action: "đã bày tỏ cảm xúc về bài viết của bạn",
    Icon: ThumbsUp,
    iconBg: "bg-blue-500",
  },
  POST_COMMENT: {
    action: "đã bình luận bài viết của bạn",
    Icon: MessageCircle,
    iconBg: "bg-green-500",
  },
  COMMENT_REPLY: {
    action: "đã trả lời bình luận của bạn",
    Icon: Reply,
    iconBg: "bg-green-500",
  },
  COMMENT_REACTION: {
    action: "đã bày tỏ cảm xúc về bình luận của bạn",
    Icon: ThumbsUp,
    iconBg: "bg-blue-500",
  },
  FRIEND_REQUEST: {
    action: "đã gửi cho bạn lời mời kết bạn",
    Icon: UserPlus,
    iconBg: "bg-blue-500",
  },
  FRIEND_ACCEPTED: {
    action: "đã chấp nhận lời mời kết bạn của bạn",
    Icon: UserCheck,
    iconBg: "bg-green-500",
  },
};

function buildActorText(notification: Notification): string {
  const { actors, actorCount } = notification;

  const primary = actors[0]?.username ?? "Ai đó";
  const othersCount = actorCount - 1;

  if (othersCount <= 0) return primary;
  if (othersCount === 1 && actors[1]) {
    return `${primary} và ${actors[1].username}`;
  }
  return `${primary} và ${othersCount} người khác`;
}

interface Props {
  notification: Notification;
  onClick: (notification: Notification) => void;
}

const NotificationItem = ({ notification, onClick }: Props) => {
  const meta = NOTIFICATION_META[notification.type];
  const actorText = buildActorText(notification);

  return (
    <button
      className={cn(
        "flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-gray-100",
        !notification.isRead && "bg-blue-50/60 hover:bg-blue-50",
      )}
      onClick={() => onClick(notification)}
    >
      <div className="relative shrink-0">
        <Avatar size="lg">
          <AvatarImage src={notification.actors[0]?.avatarUrl ?? undefined} />
          <AvatarFallback>
            {notification.actors[0]?.fullname?.[0] ?? "?"}
          </AvatarFallback>
        </Avatar>
        {meta && (
          <span
            className={cn(
              "absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-white",
              meta.iconBg,
            )}
          >
            <meta.Icon className="size-3 text-white" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-gray-900">
          <span className="font-semibold">{actorText}</span>{" "}
          {meta?.action ?? "đã gửi thông báo"}
        </p>

        <p
          className={cn(
            "mt-0.5 text-xs",
            notification.isRead
              ? "text-gray-400"
              : "font-semibold text-blue-500",
          )}
        >
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>

      {!notification.isRead && (
        <div className="flex shrink-0 items-center">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
        </div>
      )}
    </button>
  );
};

export default NotificationItem;
