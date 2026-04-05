import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { commentsApi } from "@/shared/api/comments.api";
import type { Comment, PaginatedResponse } from "@/features/feed/types/post";
import { toast } from "sonner";
import { commentKeys } from "@/features/feed/constants/queryKeys";
import { updatePostInAllCaches } from "@/shared/helpers/update-post-cache";

type CommentsData = InfiniteData<PaginatedResponse<Comment>>;

const COMMENTS_LIMIT = 10;
const REPLIES_LIMIT = 5;

export function useComments(postId: string, enabled = false) {
  return useInfiniteQuery({
    queryKey: commentKeys.byPost(postId),
    queryFn: ({ pageParam }) =>
      commentsApi.getComments(postId, {
        cursor: pageParam,
        limit: COMMENTS_LIMIT,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useReplies(postId: string, commentId: string, enabled = false) {
  return useInfiniteQuery({
    queryKey: commentKeys.replies(postId, commentId),
    queryFn: ({ pageParam }) =>
      commentsApi.getReplies(postId, commentId, {
        cursor: pageParam,
        limit: REPLIES_LIMIT,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 1000 * 30,
  });
}

export function useCreateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: {
      content: string;
      parentId?: string;
      imageUrl?: string;
    }) => commentsApi.createComment(postId, dto),

    onSuccess: (newComment) => {
      if (!newComment.parentId) {
        queryClient.setQueryData<CommentsData>(
          commentKeys.byPost(postId),
          (old) => {
            if (!old) return old;
            const firstPage = old.pages[0];
            return {
              ...old,
              pages: [
                { ...firstPage, data: [newComment, ...firstPage.data] },
                ...old.pages.slice(1),
              ],
            };
          },
        );
      } else {
        queryClient.setQueryData<CommentsData>(
          commentKeys.replies(postId, newComment.parentId),
          (old) => {
            if (!old) return old;
            const lastPage = old.pages[old.pages.length - 1];
            return {
              ...old,
              pages: [
                ...old.pages.slice(0, -1),
                { ...lastPage, data: [...lastPage.data, newComment] },
              ],
            };
          },
        );

        queryClient.setQueryData<CommentsData>(
          commentKeys.byPost(postId),
          (old) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                data: page.data.map((c) =>
                  c.id === newComment.parentId
                    ? { ...c, replyCount: c.replyCount + 1 }
                    : c,
                ),
              })),
            };
          },
        );
      }

      updatePostInAllCaches(queryClient, postId, (p) => ({
        ...p,
        commentCount: p.commentCount + 1,
      }));
    },

    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Không thể tạo bình luận",
      );
    },
  });
}

export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) =>
      commentsApi.deleteComment(postId, commentId),

    onSuccess: (_data, commentId) => {
      let deletedComment: Comment | undefined;
      let totalDeleted = 1;

      // 1. Bỏ bình luận khỏi danh sách bình luận chính và lưu lại bình luận đã xóa
      queryClient.setQueryData<CommentsData>(
        commentKeys.byPost(postId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.filter((c) => {
                if (c.id === commentId) {
                  deletedComment = c;
                  totalDeleted += c.replyCount;
                  return false;
                }
                return true;
              }),
            })),
          };
        },
      );

      // 2. Nếu không phải bình luận chính, kiểm tra các bình luận phụ
      if (!deletedComment) {
        const queriesData = queryClient.getQueriesData<CommentsData>({
          queryKey: ["comments", postId, "replies"],
        });

        for (const [key, data] of queriesData) {
          if (!data) continue;
          let found = false;
          const updated = {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              data: page.data.filter((c) => {
                if (c.id === commentId) {
                  found = true;
                  return false;
                }
                return true;
              }),
            })),
          };
          if (found) {
            queryClient.setQueryData(key, updated);
            totalDeleted = 1;

            const parentId = key[3] as string;
            queryClient.setQueryData<CommentsData>(
              commentKeys.byPost(postId),
              (old) => {
                if (!old) return old;
                return {
                  ...old,
                  pages: old.pages.map((page) => ({
                    ...page,
                    data: page.data.map((c) =>
                      c.id === parentId
                        ? { ...c, replyCount: Math.max(0, c.replyCount - 1) }
                        : c,
                    ),
                  })),
                };
              },
            );
            break;
          }
        }
      } else {
        queryClient.removeQueries({
          queryKey: commentKeys.replies(postId, commentId),
        });
      }

      // 3. Cập nhật số lượng bình luận trong tất cả các cache (feed + profile + chi tiết bài viết)
      updatePostInAllCaches(queryClient, postId, (p) => ({
        ...p,
        commentCount: Math.max(0, p.commentCount - totalDeleted),
      }));
    },

    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Không thể xóa bình luận",
      );
    },
  });
}

export function useUpdateComment(postId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      commentId: string;
      content: string;
      imageUrl?: string | null;
    }) =>
      commentsApi.updateComment(postId, params.commentId, {
        content: params.content,
        imageUrl: params.imageUrl,
      }),

    onSuccess: (updatedComment) => {
      const updateInPages = (old: CommentsData | undefined) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.map((c) =>
              c.id === updatedComment.id ? updatedComment : c,
            ),
          })),
        };
      };

      queryClient.setQueryData<CommentsData>(
        commentKeys.byPost(postId),
        updateInPages,
      );

      if (updatedComment.parentId) {
        queryClient.setQueryData<CommentsData>(
          commentKeys.replies(postId, updatedComment.parentId),
          updateInPages,
        );
      }
    },

    onError: (error) => {
      toast.error(error.message);
    },
  });
}
