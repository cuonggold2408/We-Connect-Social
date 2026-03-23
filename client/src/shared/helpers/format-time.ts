// Dùng cho feed
export const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};

// Dùng cho notification
export function formatTimeAgo(date: string | Date): string {
  const diffMs = Date.now() - new Date(date).getTime();

  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút`;
  if (hours < 24) return `${hours} giờ`;
  if (days < 7) return `${days} ngày`;
  if (weeks < 4) return `${weeks} tuần`;

  return new Date(date).toLocaleDateString("vi-VN", {
    day: "numeric",
    month: "short",
  });
}
