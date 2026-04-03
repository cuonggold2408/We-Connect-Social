export interface FriendUser {
  id: string;
  username: string;
  fullname: string | null;
  avatarUrl: string | null;
}

export interface FriendRequest {
  id: string;
  sender: FriendUser;
  createdAt: string;
}

export interface SentRequest {
  id: string;
  receiver: FriendUser;
  createdAt: string;
}

export interface Friend {
  id: string;
  friend: FriendUser;
  since: string;
}

export interface Suggestion {
  id: string;
  username: string;
  fullname: string | null;
  avatarUrl: string | null;
  mutualCount: number;
}

export type RelationshipStatus =
  | "NONE"
  | "PENDING_OUTGOING"
  | "PENDING_INCOMING"
  | "FRIENDS"
  | "SELF";

export interface RelationshipStatusResponse {
  status: RelationshipStatus;
  friendshipId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}

export type FriendshipAction =
  | "REQUEST_RECEIVED"
  | "REQUEST_ACCEPTED"
  | "REQUEST_REJECTED"
  | "REQUEST_CANCELLED"
  | "UNFRIENDED";

export interface FriendshipUpdateEvent {
  action: FriendshipAction;
  friendshipId: string;
  [key: string]: unknown;
}
