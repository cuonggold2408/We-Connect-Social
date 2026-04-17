"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/shared/api/chat.api";
import { useChatStore } from "@/shared/stores/chat.store";
import { ConversationItem } from "@/features/messenger/ui/ConversationItem";
import { Search } from "lucide-react";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ selectedId, onSelect }: Props) {
  const conversations = useChatStore((s) => s.conversations);
  const setConversations = useChatStore((s) => s.setConversations);
  const [search, setSearch] = useState("");

  useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const data = await chatApi.getConversations();
      setConversations(data);
      return data;
    },
    refetchOnWindowFocus: false,
  });

  const filtered = search
    ? conversations.filter((c) =>
        (c.otherUser.fullname ?? c.otherUser.username)
          .toLowerCase()
          .includes(search.toLowerCase()),
      )
    : conversations;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4">
        <h2 className="mb-3 text-xl font-bold text-gray-900">Tin nhắn</h2>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm cuộc hội thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus:border-blue-primary focus:ring-blue-primary w-full rounded-full border border-gray-200 bg-gray-50 py-2 pr-4 pl-10 text-sm outline-none focus:ring-1"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((conv) => (
          <ConversationItem
            key={conv.id}
            conversation={conv}
            isSelected={conv.id === selectedId}
            onClick={() => onSelect(conv.id)}
          />
        ))}

        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm text-gray-400">
            Không có cuộc hội thoại nào
          </p>
        )}
      </div>
    </div>
  );
}
