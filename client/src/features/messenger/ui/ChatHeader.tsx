"use client";

import { Phone, Video } from "lucide-react";
import { useEffect, useState } from "react";
import { useCallStore } from "@/shared/stores/call.store";
import type { Socket } from "socket.io-client";
import Image from "next/image";
import { DEFAULT_AVATAR_URL } from "@/shared/helpers/constants";
import { cn } from "@/shared/lib/utils";
import { formatPresence } from "@/shared/helpers/format-presence";

interface OtherUser {
  id: string;
  username: string;
  fullname: string | null;
  avatarUrl: string | null;
}

interface Props {
  otherUser: OtherUser;
  isOnline: boolean;
  lastSeen: string | null;
  callSocketRef: React.RefObject<Socket | null>;
  conversationId: string;
}

export function ChatHeader({
  otherUser,
  isOnline,
  lastSeen,
  callSocketRef,
  conversationId,
}: Props) {
  const callState = useCallStore((s) => s.callState);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [forceTick, setForceTick] = useState(0);
  const isInitiating = useCallStore((s) => s.isInitiating);
  const setInitiating = useCallStore((s) => s.setInitiating);

  const initiateCall = (type: "AUDIO" | "VIDEO") => {
    if (callState !== "idle" || isInitiating || !callSocketRef.current) return;
    setInitiating(true);
    callSocketRef.current.emit("call-initiate", {
      conversationId,
      calleeId: otherUser.id,
      type,
    });
    setTimeout(() => {
      if (useCallStore.getState().callState === "idle") {
        useCallStore.getState().setInitiating(false);
      }
    }, 5000);
  };

  useEffect(() => {
    if (isOnline || !lastSeen) return;
    const id = setInterval(() => setForceTick((x) => x + 1), 60000);
    return () => clearInterval(id);
  }, [isOnline, lastSeen]);

  const presence = formatPresence(isOnline, lastSeen);

  return (
    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="relative">
          <Image
            src={otherUser.avatarUrl ?? DEFAULT_AVATAR_URL}
            alt={otherUser.fullname ?? otherUser.username}
            className="h-10 w-10 rounded-full object-cover"
            width={40}
            height={40}
            priority
          />
          {presence.showDot && (
            <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">
            {otherUser.fullname ?? otherUser.username}
          </p>
          <p
            className={cn(
              "text-xs",
              presence.variant === "online"
                ? "text-green-600"
                : presence.variant === "recent"
                  ? "text-gray-600"
                  : presence.variant === "away"
                    ? "text-gray-500"
                    : "text-gray-400",
            )}
          >
            {presence.text}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => initiateCall("AUDIO")}
          disabled={callState !== "idle" || isInitiating}
          className="hover:text-blue-primary rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50"
          aria-label="Gọi thoại"
        >
          <Phone className="h-5 w-5" />
        </button>
        <button
          onClick={() => initiateCall("VIDEO")}
          disabled={callState !== "idle" || isInitiating}
          className="hover:text-blue-primary rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50"
          aria-label="Gọi video"
        >
          <Video className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
