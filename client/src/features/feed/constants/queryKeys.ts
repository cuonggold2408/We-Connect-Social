export const feedKeys = {
  all: ["feed"] as const,
};

export const commentKeys = {
  byPost: (postId: string) => ["comments", postId] as const,
  replies: (postId: string, commentId: string) =>
    ["comments", postId, "replies", commentId] as const,
};
