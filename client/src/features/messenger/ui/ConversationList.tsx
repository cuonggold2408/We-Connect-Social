"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/shared/api/chat.api";
import { useChatStore } from "@/shared/stores/chat.store";
import { ConversationItem } from "@/features/messenger/ui/ConversationItem";
import { PenSquare, Search } from "lucide-react";
import { useFriendSearch } from "../hooks/useFriendSearch";
import { useStartConversation } from "../hooks/useStartConversation";
import { FriendSearchResult } from "./FriendSearchResult";
import { NewMessageDialog } from "./NewMessageDialog";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-1 text-xs font-semibold tracking-wide text-gray-400 uppercase">
      {children}
    </div>
  );
}

export function ConversationList({ selectedId, onSelect }: Props) {
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const [search, setSearch] = useState("");
  const [openCompose, setOpenCompose] = useState(false);
  useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const data = await chatApi.getConversations();
      setConversations(data);
      return data;
    },
    refetchOnWindowFocus: false,
  });
  const { matches: friendMatches, isLoading: isSearchingFriends } =
    useFriendSearch(search);
  const startConversation = useStartConversation({
    onSuccess: (conversationId) => {
      setSearch("");
      onSelect(conversationId);
    },
  });
  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      (c.otherUser.fullname ?? c.otherUser.username).toLowerCase().includes(q),
    );
  }, [conversations, search]);

  const friendIdsInConversations = useMemo(
    () => new Set(conversations.map((c) => c.otherUser.id)),
    [conversations],
  );
  const newFriendMatches = friendMatches.filter(
    (f) => !friendIdsInConversations.has(f.friend.id),
  );
  const isSearching = search.trim().length > 0;
  const noResults =
    isSearching &&
    !isSearchingFriends &&
    filteredConversations.length === 0 &&
    newFriendMatches.length === 0;
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Tin nhắn</h2>
          <button
            type="button"
            aria-label="Tin nhắn mới"
            onClick={() => setOpenCompose(true)}
            className="hover:text-blue-primary rounded-full p-2 text-gray-600 transition-colors hover:bg-blue-50"
          >
            <PenSquare className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm bạn bè hoặc cuộc hội thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:border-blue-primary focus:ring-blue-primary w-full rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm outline-none focus:ring-1"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {isSearching && filteredConversations.length > 0 && (
          <SectionLabel>Cuộc hội thoại</SectionLabel>
        )}
        {filteredConversations.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isSelected={conv.id === selectedId}
            onClick={() => onSelect(conv.id)}
          />
        ))}
        {!isSearching && filteredConversations.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-400">
            Chưa có cuộc hội thoại. Nhấn vào icon bút để bắt đầu.
          </p>
        )}
        {isSearching && newFriendMatches.length > 0 && (
          <>
            <SectionLabel>Bạn bè</SectionLabel>
            {newFriendMatches.map((f) => (
              <FriendSearchResult
                key={f.friend.id}
                user={f.friend}
                isPending={
                  startConversation.isPending &&
                  startConversation.variables === f.friend.id
                }
                onClick={() => startConversation.mutate(f.friend.id)}
              />
            ))}
          </>
        )}
        {isSearching && isSearchingFriends && (
          <p className="px-4 py-2 text-center text-xs text-gray-400">
            Đang tìm…
          </p>
        )}
        {noResults && (
          <p className="p-4 text-center text-sm text-gray-400">
            Không tìm thấy kết quả nào cho “{search}”.
          </p>
        )}
      </div>
      <NewMessageDialog
        open={openCompose}
        onOpenChange={setOpenCompose}
        onPicked={(conversationId) => {
          setOpenCompose(false);
          onSelect(conversationId);
        }}
      />
    </div>
  );
}
