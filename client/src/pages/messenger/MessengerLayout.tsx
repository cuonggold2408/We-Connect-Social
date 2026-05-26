"use client";

import { useEffect, useState } from "react";
import { ConversationList } from "@/features/messenger/ui/ConversationList";
import { ChatPanel } from "@/features/messenger/ui/ChatPanel";
import { useChatSocket } from "@/features/messenger/hooks/useChatSocket";
import { useCallSocket } from "@/features/messenger/hooks/useCallSocket";
import { VideoCallModal } from "@/features/messenger/ui/VideoCallModal";
import { IncomingCallDialog } from "@/features/messenger/ui/IncomingCallDialog";
import { useCallStore } from "@/shared/stores/call.store";

export function MessengerLayout() {
  const chatSocketRef = useChatSocket();
  const callSocketRef = useCallSocket();
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  const callState = useCallStore((s) => s.callState);

  useEffect(() => {
    const handlePageHide = () => {
      const { callSessionId, callState } = useCallStore.getState();
      if (!callSessionId) return;
      if (callState === "incoming-ringing") {
        callSocketRef.current?.emit("call-reject", { callSessionId });
      } else if (callState !== "idle" && callState !== "ended") {
        callSocketRef.current?.emit("call-end", { callSessionId });
      }
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [callSocketRef]);

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Left: Conversation list */}
      <div className="w-80 shrink-0 border-r border-gray-200 bg-white">
        <ConversationList
          selectedId={selectedConversationId}
          onSelect={setSelectedConversationId}
        />
      </div>

      {/* Right: Chat panel */}
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        {selectedConversationId ? (
          <ChatPanel
            conversationId={selectedConversationId}
            chatSocketRef={chatSocketRef}
            callSocketRef={callSocketRef}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg font-medium">Chọn cuộc hội thoại</p>
              <p className="text-sm">
                Chọn một cuộc trò chuyện để bắt đầu nhắn tin
              </p>
            </div>
          </div>
        )}
      </div>

      {callState !== "idle" && callState !== "incoming-ringing" && (
        <VideoCallModal callSocketRef={callSocketRef} />
      )}

      {callState === "incoming-ringing" && (
        <IncomingCallDialog callSocketRef={callSocketRef} />
      )}
    </div>
  );
}
