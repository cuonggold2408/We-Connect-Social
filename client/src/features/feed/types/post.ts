export type ReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";
export type PostVisibility = "PUBLIC" | "FRIENDS" | "PRIVATE";

export interface PostAuthor {
  id: string;
  username: string;
  fullname: string | null;
  avatarUrl: string | null;
}

export interface PostImage {
  id: string;
  imageUrl: string;
  position: number;
}

export interface Comment {
  id: string;
  content: string;
  imageUrl: string | null;
  author: PostAuthor;
  parentId: string | null;
  replyCount: number;
  isPostAuthor: boolean;
  reactionCount: number;
  currentUserReaction: ReactionType | null;
  stats: { type: ReactionType; count: number }[] | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface Post {
  id: string;
  content: string | null;
  visibility: PostVisibility;
  author: PostAuthor;
  images: PostImage[];
  reactionCount: number;
  commentCount: number;
  shareCount: number;
  currentUserReaction: ReactionType | null;
  stats: { type: ReactionType; count: number }[] | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
}
export interface CreatePostDto {
  content?: string;
  imageUrls?: string[];
  visibility?: PostVisibility;
}

export interface CreateCommentDto {
  content: string;
  parentId?: string;
  imageUrl?: string;
}

export interface ReactionUser {
  id: string;
  username: string;
  fullname: string | null;
  avatarUrl: string | null;
}

export interface ReactionItem {
  id: string;
  type: ReactionType;
  user: ReactionUser;
}
