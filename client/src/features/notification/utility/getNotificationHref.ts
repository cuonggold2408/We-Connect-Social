import type { Notification } from "@/shared/types/notification.types";

export function getNotificationHref(notification: Notification): string {
  const { type, entityId, metadata } = notification;

  switch (type) {
    case "POST_REACTION":
      return `/posts/${entityId}`;
    case "POST_COMMENT": {
      const commentId = metadata?.commentId as string | undefined;
      const base = `/posts/${entityId}`;
      return commentId ? `${base}?commentId=${commentId}` : base;
    }

    case "COMMENT_REPLY":
    case "COMMENT_REACTION": {
      const postId = metadata?.postId as string | undefined;
      if (!postId) return "/";
      return `/posts/${postId}?commentId=${entityId}`;
    }

    case "FRIEND_REQUEST":
    case "FRIEND_ACCEPTED":
      return "/"; // tạm thời — khi có trang profile thì update

    default:
      return "/";
  }
}
