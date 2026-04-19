"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useFriends } from "@/features/friends/hooks/useFriendQueries";
import { useStartConversation } from "@/features/messenger/hooks/useStartConversation";
import { FriendSearchResult } from "@/features/messenger/ui/FriendSearchResult";
import { useDebouncedValue } from "@/features/messenger/hooks/useFriendSearch";
import { useChatStore } from "@/shared/stores/chat.store";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPicked: (conversationId: string) => void;
}

export function NewMessageDialog({ open, onOpenChange, onPicked }: Props) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim().toLowerCase());

  const { data, isLoading } = useFriends();
  const conversations = useChatStore((s) => s.conversations);

  const friendIdsWithConversation = useMemo(
    () => new Set(conversations.map((c) => c.otherUser.id)),
    [conversations],
  );

  const friends = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  const newFriends = useMemo(
    () => friends.filter((f) => !friendIdsWithConversation.has(f.friend.id)),
    [friends, friendIdsWithConversation],
  );

  const filtered = useMemo(() => {
    if (!debounced) return newFriends;
    return newFriends.filter((f) => {
      const name = (f.friend.fullname ?? "").toLowerCase();
      return (
        name.includes(debounced) ||
        f.friend.username.toLowerCase().includes(debounced)
      );
    });
  }, [newFriends, debounced]);

  const start = useStartConversation({
    onSuccess: (conversationId) => {
      setQuery("");
      onPicked(conversationId);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Không thể mở cuộc trò chuyện",
      );
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) setQuery("");
    onOpenChange(next);
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    if (filtered.length > 0) return null;

    if (debounced) {
      return (
        <p className="p-6 text-center text-sm text-gray-400">
          Không tìm thấy bạn bè khớp với “{query.trim()}”.
        </p>
      );
    }
    if (friends.length === 0) {
      return (
        <p className="p-6 text-center text-sm text-gray-400">
          Bạn chưa có bạn bè nào
        </p>
      );
    }
    return (
      <p className="p-6 text-center text-sm text-gray-400">
        Bạn đã có cuộc trò chuyện với tất cả bạn bè rồi
      </p>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b p-4">
          <DialogTitle>Tin nhắn mới</DialogTitle>
        </DialogHeader>

        <div className="border-b p-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm bạn bè để bắt đầu chat..."
              className="focus:border-blue-primary focus:ring-blue-primary w-full rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm outline-none focus:ring-1"
            />
          </div>
        </div>

        <div
          className="max-h-[60vh] overflow-y-auto"
          aria-busy={start.isPending}
        >
          {isLoading && (
            <p className="p-4 text-center text-sm text-gray-400">Đang tải...</p>
          )}

          {renderEmpty()}

          {filtered.map((f) => {
            const isThisPending =
              start.isPending && start.variables === f.friend.id;
            return (
              <FriendSearchResult
                key={f.friend.id}
                user={f.friend}
                isPending={isThisPending}
                onClick={() => {
                  if (start.isPending) return;
                  start.mutate(f.friend.id);
                }}
              />
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
