export type ReactionType = "LIKE" | "LOVE" | "HAHA" | "WOW" | "SAD" | "ANGRY";

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
  author: PostAuthor;
  createdAt: string;
  _count?: { replies: number };
}

export interface Post {
  id: string;
  content: string | null;
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
}

export interface CreateCommentDto {
  content: string;
  parentId?: string;
}
