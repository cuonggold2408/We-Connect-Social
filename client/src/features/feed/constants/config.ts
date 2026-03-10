import { ReactionType } from "@/features/feed/types/post";

export const REACTION_CONFIG: Record<
  ReactionType,
  { icon: string; label: string; color: string }
> = {
  LIKE: { icon: "👍", label: "Thích", color: "text-blue-600" },
  LOVE: { icon: "❤️", label: "Yêu thích", color: "text-red-500" },
  HAHA: { icon: "😆", label: "Haha", color: "text-yellow-500" },
  WOW: { icon: "😮", label: "Wow", color: "text-yellow-500" },
  SAD: { icon: "😢", label: "Buồn", color: "text-yellow-500" },
  ANGRY: { icon: "😡", label: "Phẫn nộ", color: "text-orange-500" },
};
