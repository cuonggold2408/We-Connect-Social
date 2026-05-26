"use client";

import { Users, UserPlus, Send, Loader2, UsersRound } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { EmptyState } from "@/shared/components/EmptyState";
import {
  useReceivedRequests,
  useSentRequests,
  useFriends,
  useSuggestions,
} from "@/features/friends/hooks/useFriendQueries";
import {
  useFriendCount,
  usePendingReceivedCount,
} from "@/features/friends/hooks/useFriendQueries";
import { FriendRequestCard } from "@/features/friends/ui/FriendRequestCard";
import { FriendCard } from "@/features/friends/ui/FriendCard";
import { SentRequestCard } from "@/features/friends/ui/SentRequestCard";
import { SuggestionCard } from "@/features/friends/ui/SuggestionCard";

function LoadMoreButton({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
}) {
  if (!hasNextPage) return null;

  return (
    <div className="flex justify-center pt-2">
      <Button
        variant="outline"
        onClick={onLoadMore}
        disabled={isFetchingNextPage}
      >
        {isFetchingNextPage && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Xem thêm
      </Button>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );
}

const FriendsContent = () => {
  const receivedQuery = useReceivedRequests();
  const sentQuery = useSentRequests();
  const friendsQuery = useFriends();
  const { data: friendCount } = useFriendCount();
  const { data: pendingCount } = usePendingReceivedCount();

  const suggestionsQuery = useSuggestions();
  const suggestions = suggestionsQuery.data ?? [];

  const receivedRequests =
    receivedQuery.data?.pages.flatMap((p) => p.data) ?? [];
  const sentRequests = sentQuery.data?.pages.flatMap((p) => p.data) ?? [];
  const friends = friendsQuery.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bạn bè</h1>
        <p className="mt-1 text-sm text-gray-500">
          Quản lý bạn bè và lời mời kết bạn
        </p>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="mb-6 grid w-full grid-cols-4">
          <TabsTrigger
            value="received"
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <UserPlus className="h-4 w-4" />
            Lời mời nhận được
            {(pendingCount ?? 0) > 0 && (
              <Badge
                variant="destructive"
                className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-xs"
              >
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="friends"
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <Users className="h-4 w-4" />
            Bạn bè
            {(friendCount ?? 0) > 0 && (
              <Badge
                variant="secondary"
                className="ml-1 h-5 min-w-5 rounded-full px-1.5 text-xs"
              >
                {friendCount}
              </Badge>
            )}
          </TabsTrigger>

          <TabsTrigger
            value="sent"
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <Send className="h-4 w-4" />
            Lời mời đã gửi
          </TabsTrigger>

          <TabsTrigger
            value="suggestions"
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <UsersRound className="h-4 w-4" />
            Gợi ý kết bạn
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          {receivedQuery.isLoading ? (
            <LoadingSpinner />
          ) : receivedRequests.length === 0 ? (
            <EmptyState
              icon={<UserPlus className="h-12 w-12 text-gray-300" />}
              title="Không có lời mời nào"
              description="Khi ai đó gửi lời mời kết bạn, bạn sẽ thấy ở đây."
            />
          ) : (
            <div className="space-y-3">
              {receivedRequests.map((req) => (
                <FriendRequestCard key={req.id} request={req} />
              ))}
              <LoadMoreButton
                hasNextPage={receivedQuery.hasNextPage}
                isFetchingNextPage={receivedQuery.isFetchingNextPage}
                onLoadMore={() => receivedQuery.fetchNextPage()}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {sentQuery.isLoading ? (
            <LoadingSpinner />
          ) : sentRequests.length === 0 ? (
            <EmptyState
              icon={<Send className="h-12 w-12 text-gray-300" />}
              title="Chưa gửi lời mời nào"
              description="Lời mời kết bạn bạn đã gửi sẽ hiển thị ở đây."
            />
          ) : (
            <div className="space-y-3">
              {sentRequests.map((req) => (
                <SentRequestCard key={req.id} request={req} />
              ))}
              <LoadMoreButton
                hasNextPage={sentQuery.hasNextPage}
                isFetchingNextPage={sentQuery.isFetchingNextPage}
                onLoadMore={() => sentQuery.fetchNextPage()}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="friends">
          {friendsQuery.isLoading ? (
            <LoadingSpinner />
          ) : friends.length === 0 ? (
            <EmptyState
              icon={<Users className="h-12 w-12 text-gray-300" />}
              title="Chưa có bạn bè"
              description="Hãy gửi lời mời kết bạn để kết nối với mọi người!"
            />
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <FriendCard key={friend.id} data={friend} />
              ))}
              <LoadMoreButton
                hasNextPage={friendsQuery.hasNextPage}
                isFetchingNextPage={friendsQuery.isFetchingNextPage}
                onLoadMore={() => friendsQuery.fetchNextPage()}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="suggestions">
          {suggestionsQuery.isLoading ? (
            <LoadingSpinner />
          ) : suggestions.length === 0 ? (
            <EmptyState
              icon={<UsersRound className="h-12 w-12 text-gray-300" />}
              title="Không có gợi ý nào"
              description="Hệ thống sẽ gợi ý bạn bè dựa trên bạn chung khi có dữ liệu phù hợp."
            />
          ) : (
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <SuggestionCard key={suggestion.id} suggestion={suggestion} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
};

export default FriendsContent;
