import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { reactionsApi } from "@/shared/api/reactions.api";
import type {
  ReactionType,
  Post,
  PaginatedResponse,
} from "@/features/feed/types/post";
import { feedKeys } from "@/features/feed/constants/queryKeys";

type FeedData = InfiniteData<PaginatedResponse<Post>>;

interface ReactionContext {
  previousFeed: FeedData | undefined;
  previousPost: Post | undefined;
}

function updatePostInFeed(
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

function buildOptimisticPost(post: Post, nextType: ReactionType | null): Post {
  const oldType = post.currentUserReaction;
  const newStats = [...(post.stats || [])];

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
    ...post,
    currentUserReaction: nextType,
    stats: newStats,
    reactionCount: Math.max(0, post.reactionCount + countDelta),
  };
}

export function useReaction(postId: string) {
  const queryClient = useQueryClient();

  const applyOptimistic = (nextType: ReactionType | null): ReactionContext => {
    const previousFeed = queryClient.getQueryData<FeedData>(feedKeys.all);
    const previousPost = queryClient.getQueryData<Post>(["post", postId]);

    if (previousFeed) {
      queryClient.setQueryData<FeedData>(feedKeys.all, (old) =>
        old
          ? updatePostInFeed(old, postId, (p) =>
              buildOptimisticPost(p, nextType),
            )
          : old,
      );
    }

    if (previousPost) {
      queryClient.setQueryData<Post>(
        ["post", postId],
        buildOptimisticPost(previousPost, nextType),
      );
    }

    return { previousFeed, previousPost };
  };

  const rollback = (context: ReactionContext | undefined) => {
    if (context?.previousFeed) {
      queryClient.setQueryData(feedKeys.all, context.previousFeed);
    }
    if (context?.previousPost) {
      queryClient.setQueryData(
        ["post", context.previousPost.id],
        context.previousPost,
      );
    }
  };

  const reactMutation = useMutation({
    mutationFn: (type: ReactionType) => reactionsApi.react(postId, type),
    onMutate: async (type) => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all });
      return applyOptimistic(type);
    },
    onError: (_err, _type, context) => rollback(context),
  });

  const removeMutation = useMutation({
    mutationFn: () => reactionsApi.removeReaction(postId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: feedKeys.all });
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
