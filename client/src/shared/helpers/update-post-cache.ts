import type { InfiniteData } from "@tanstack/react-query";
import type { Post, PaginatedResponse } from "@/features/feed/types/post";
import type { QueryClient } from "@tanstack/react-query";
import { feedKeys } from "@/features/feed/constants/queryKeys";

type FeedData = InfiniteData<PaginatedResponse<Post>>;

export function updatePostInAllCaches(
  queryClient: QueryClient,
  postId: string,
  updater: (post: Post) => Post,
) {
  // Cập nhật cache feed chính
  queryClient.setQueryData<FeedData>(feedKeys.all, (old) =>
    old ? updatePostInPages(old, postId, updater) : old,
  );

  // Cập nhật cache bài viết của tất cả người dùng
  const profilePostQueries = queryClient.getQueriesData<FeedData>({
    queryKey: ["profile", "posts"],
  });
  for (const [key, data] of profilePostQueries) {
    if (data) {
      queryClient.setQueryData<FeedData>(key, (old) =>
        old ? updatePostInPages(old, postId, updater) : old,
      );
    }
  }

  // Cập nhật cache chi tiết bài viết
  queryClient.setQueryData<Post>(["post", postId], (old) =>
    old ? updater(old) : old,
  );
}

function updatePostInPages(
  feed: FeedData,
  postId: string,
  updater: (post: Post) => Post,
): FeedData {
  return {
    ...feed,
    pages: feed.pages.map((page) => ({
      ...page,
      data: page.data.map((p) => (p.id === postId ? updater(p) : p)),
    })),
  };
}
