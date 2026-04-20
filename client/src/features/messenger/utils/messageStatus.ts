import type { MessageItem } from "@/shared/api/chat.api";

export type MessageStatus =
  | "pending"
  | "failed"
  | "sent"
  | "delivered"
  | "seen";

export const STATUS_LABEL: Record<MessageStatus, string> = {
  pending: "Đang gửi…",
  failed: "Gửi lỗi",
  sent: "Đã gửi",
  delivered: "Đã nhận",
  seen: "Đã xem",
};

interface ComputeArgs {
  message: MessageItem & { _failed?: boolean };
  peerId: string;
  peerLastReadAt: string | null;
  isPeerOnline: boolean;
}

export function computeMessageStatus({
  message,
  peerLastReadAt,
  isPeerOnline,
}: ComputeArgs): MessageStatus {
  if ((message as { _failed?: boolean })._failed) return "failed";
  if (message.id.startsWith("temp-")) return "pending";

  if (
    peerLastReadAt &&
    new Date(peerLastReadAt).getTime() >= new Date(message.createdAt).getTime()
  ) {
    return "seen";
  }

  return isPeerOnline ? "delivered" : "sent";
}
