const ONLINE_THRESHOLD_SEC = 60;

export type PresenceLabel = {
  text: string;
  variant: "online" | "recent" | "away" | "inactive" | "unknown";
  showDot: boolean;
};

export function formatPresence(
  isOnline: boolean,
  lastSeen: string | null,
): PresenceLabel {
  if (isOnline) {
    return { text: "Đang hoạt động", variant: "online", showDot: true };
  }
  if (!lastSeen) {
    return { text: "Không hoạt động", variant: "unknown", showDot: false };
  }
  const diffSec = Math.max(
    0,
    Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000),
  );

  if (diffSec < ONLINE_THRESHOLD_SEC) {
    return {
      text: "Vừa hoạt động",
      variant: "recent",
      showDot: false,
    };
  }

  const min = Math.floor(diffSec / 60);
  if (min < 60) {
    return {
      text: `Hoạt động ${min} phút trước`,
      variant: "recent",
      showDot: false,
    };
  }

  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return {
      text: `Hoạt động ${hr} giờ trước`,
      variant: "away",
      showDot: false,
    };
  }

  const days = Math.floor(hr / 24);
  if (days < 7) {
    return {
      text: `Hoạt động ${days} ngày trước`,
      variant: "inactive",
      showDot: false,
    };
  }

  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return {
      text: `Hoạt động ${weeks} tuần trước`,
      variant: "inactive",
      showDot: false,
    };
  }

  return {
    text: "Đã offline lâu",
    variant: "inactive",
    showDot: false,
  };
}

export function compactPresence(p: PresenceLabel): string {
  if (p.variant === "online") return "Active";
  return p.text.replace("Hoạt động ", "").replace(" trước", "");
}
