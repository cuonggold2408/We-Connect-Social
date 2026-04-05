export type RelationshipStatus =
  | "NONE"
  | "PENDING_OUTGOING"
  | "PENDING_INCOMING"
  | "FRIENDS"
  | "SELF";

export type UserGender = "MALE" | "FEMALE" | "OTHER";

export interface UserProfile {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string | null;
  gender: UserGender | null;
  birthday: string | null;
  address: string | null;
  isVerifiedBadge: boolean;
  createdAt: string;
  friendCount: number;
  mutualFriendCount: number;
  relationshipStatus: RelationshipStatus;
}

export interface UpdateProfileData {
  fullname?: string;
  bio?: string;
  gender?: UserGender;
  birthday?: string;
  address?: string;
}
