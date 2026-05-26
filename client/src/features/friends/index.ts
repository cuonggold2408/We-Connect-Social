export { friendshipsApi } from "@/shared/api/friendships.api";

export {
  useRelationshipStatus,
  useReceivedRequests,
  useSentRequests,
  useFriends,
  useFriendCount,
  usePendingReceivedCount,
} from "@/features/friends/hooks/useFriendQueries";

export {
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useCancelFriendRequest,
  useUnfriend,
} from "@/features/friends/hooks/useFriendActions";

export { useFriendshipSocket } from "@/features/friends/hooks/useFriendshipSocket";

export { default as FriendsContent } from "@/pages/friends/FriendsContent";
export { FriendRequestButton } from "@/features/friends/ui/FriendRequestButton";
export { FriendRequestCard } from "@/features/friends/ui/FriendRequestCard";
export { FriendCard } from "@/features/friends/ui/FriendCard";
export { SuggestionCard } from "@/features/friends/ui/SuggestionCard";
export { SentRequestCard } from "@/features/friends/ui/SentRequestCard";

export type {
  FriendUser,
  FriendRequest,
  SentRequest,
  Friend,
  RelationshipStatus,
  RelationshipStatusResponse,
} from "@/features/friends/types/friendship.types";

export { useSuggestions } from "@/features/friends/hooks/useFriendQueries";
export { useDismissSuggestion } from "@/features/friends/hooks/useFriendActions";

export type { Suggestion } from "@/features/friends/types/friendship.types";
