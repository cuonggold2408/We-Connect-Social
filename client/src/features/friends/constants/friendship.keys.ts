export const friendshipKeys = {
  all: ["friendships"] as const,
  receivedRequests: () => [...friendshipKeys.all, "received"] as const,
  sentRequests: () => [...friendshipKeys.all, "sent"] as const,
  pendingCount: () => [...friendshipKeys.all, "pending-count"] as const,
  friends: () => [...friendshipKeys.all, "friends"] as const,
  friendCount: () => [...friendshipKeys.all, "friend-count"] as const,
  status: (userId: string) =>
    [...friendshipKeys.all, "status", userId] as const,
};
