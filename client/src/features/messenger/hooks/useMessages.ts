import { chatApi } from "@/shared/api/chat.api";
import { useChatStore } from "@/shared/stores/chat.store";
import { useInfiniteQuery } from "@tanstack/react-query";
import { messageKeys } from "@/features/messenger/constants/message.keys";

export function useMessages(conversationId: string | null) {
  const setMessages = useChatStore((s) => s.setMessages);
  const prependMessages = useChatStore((s) => s.prependMessages);
  const setPeerReadStatus = useChatStore((s) => s.setPeerReadStatus);

  return useInfiniteQuery({
    queryKey: messageKeys.conversation(conversationId ?? ""),
    queryFn: async ({ pageParam }) => {
      const res = await chatApi.getMessages(conversationId!, pageParam);

      if (!pageParam) {
        setMessages(conversationId!, res.data);
        setPeerReadStatus(conversationId!, res.readStatus);
      } else {
        prependMessages(conversationId!, res.data);
      }

      return res;
    },

    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,

    enabled: !!conversationId,
    refetchOnWindowFocus: false,
  });
}
