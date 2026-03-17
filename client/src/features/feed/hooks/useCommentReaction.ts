import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { commentReactionsApi } from "@/shared/api/comment-reactions.api";
import type {
  ReactionType,
  Comment,
  PaginatedResponse,
} from "@/features/feed/types/post";
import { commentKeys } from "@/features/feed/constants/queryKeys";

type CommentsData = InfiniteData<PaginatedResponse<Comment>>;

interface ReactionContext {
  prevByPost: CommentsData | undefined;
  prevReplies: CommentsData | undefined;
}

function updateCommentInPages(
  data: CommentsData,
  commentId: string,
  updater: (comment: Comment) => Comment,
): CommentsData {
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.map((c) => (c.id === commentId ? updater(c) : c)),
    })),
  };
}

function buildOptimisticComment(
  comment: Comment,
  nextType: ReactionType | null,
): Comment {
  const oldType = comment.currentUserReaction;
  const newStats = [...(comment.stats || [])];

  if (oldType) {
    const idx = newStats.findIndex((s) => s.type === oldType);
    if (idx !== -1) {
      const updated = newStats[idx].count - 1;
      if (updated <= 0) newStats.splice(idx, 1);
      else newStats[idx] = { ...newStats[idx], count: updated };
    }
  }

  if (nextType) {
    const idx = newStats.findIndex((s) => s.type === nextType);
    if (idx !== -1) {
      newStats[idx] = { ...newStats[idx], count: newStats[idx].count + 1 };
    } else {
      newStats.push({ type: nextType, count: 1 });
    }
  }

  newStats.sort((a, b) => b.count - a.count);

  const countDelta = oldType && nextType ? 0 : nextType ? 1 : -1;

  return {
    ...comment,
    currentUserReaction: nextType,
    stats: newStats,
    reactionCount: Math.max(0, comment.reactionCount + countDelta),
  };
}

export function useCommentReaction(
  postId: string,
  commentId: string,
  parentId: string | null,
) {
  const queryClient = useQueryClient();

  const byPostKey = commentKeys.byPost(postId);
  const repliesKey = parentId ? commentKeys.replies(postId, parentId) : null;

  const applyOptimistic = (nextType: ReactionType | null): ReactionContext => {
    const prevByPost = queryClient.getQueryData<CommentsData>(byPostKey);
    const prevReplies = repliesKey
      ? queryClient.getQueryData<CommentsData>(repliesKey)
      : undefined;

    const updater = (c: Comment) => buildOptimisticComment(c, nextType);

    if (prevByPost) {
      queryClient.setQueryData<CommentsData>(byPostKey, (old) =>
        old ? updateCommentInPages(old, commentId, updater) : old,
      );
    }

    if (repliesKey && prevReplies) {
      queryClient.setQueryData<CommentsData>(repliesKey, (old) =>
        old ? updateCommentInPages(old, commentId, updater) : old,
      );
    }

    return { prevByPost, prevReplies };
  };

  const rollback = (context: ReactionContext | undefined) => {
    if (!context) return;
    if (context.prevByPost !== undefined) {
      queryClient.setQueryData(byPostKey, context.prevByPost);
    }
    if (repliesKey && context.prevReplies !== undefined) {
      queryClient.setQueryData(repliesKey, context.prevReplies);
    }
  };

  const reactMutation = useMutation({
    mutationFn: (type: ReactionType) =>
      commentReactionsApi.react(commentId, type),
    onMutate: async (type) => {
      await queryClient.cancelQueries({ queryKey: byPostKey });
      if (repliesKey) {
        await queryClient.cancelQueries({ queryKey: repliesKey });
      }
      return applyOptimistic(type);
    },
    onError: (_err, _type, context) => rollback(context),
  });

  const removeMutation = useMutation({
    mutationFn: () => commentReactionsApi.removeReaction(commentId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: byPostKey });
      if (repliesKey) {
        await queryClient.cancelQueries({ queryKey: repliesKey });
      }
      return applyOptimistic(null);
    },
    onError: (_err, _vars, context) => rollback(context),
  });

  const toggleReaction = (type: ReactionType | null) => {
    if (type === null) {
      removeMutation.mutate();
    } else {
      reactMutation.mutate(type);
    }
  };

  return {
    toggleReaction,
    isPending: reactMutation.isPending || removeMutation.isPending,
  };
}
