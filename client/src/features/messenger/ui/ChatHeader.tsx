import { Phone, Video } from "lucide-react";
import { useCallStore } from "@/shared/stores/call.store";
import type { Socket } from "socket.io-client";
import Image from "next/image";
import { DEFAULT_AVATAR_URL } from "@/shared/helpers/constants";

interface OtherUser {
  id: string;
  username: string;
  fullname: string | null;
  avatarUrl: string | null;
}

interface Props {
  otherUser: OtherUser;
  isOnline: boolean;
  callSocketRef: React.RefObject<Socket | null>;
  conversationId: string;
}

export function ChatHeader({
  otherUser,
  isOnline,
  callSocketRef,
  conversationId,
}: Props) {
  const callState = useCallStore((s) => s.callState);

  const initiateCall = (type: "AUDIO" | "VIDEO") => {
    if (callState !== "idle" || !callSocketRef.current) return;

    callSocketRef.current.emit("call-initiate", {
      conversationId,
      calleeId: otherUser.id,
      type,
    });

    useCallStore.getState().startOutgoingCall({
      callType: type,
      conversationId,
      remoteUser: otherUser,
    });
  };

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
          {isOnline && (
            <span className="absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
          )}
        </div>
        <div>
          <p className="font-semibold text-gray-900">
            {otherUser.fullname ?? otherUser.username}
          </p>
          <p className="text-xs text-gray-500">
            {isOnline ? "Đang hoạt động" : "Không hoạt động"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => initiateCall("AUDIO")}
          disabled={callState !== "idle"}
          className="hover:text-blue-primary rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50"
        >
          <Phone className="h-5 w-5" />
        </button>
        <button
          onClick={() => initiateCall("VIDEO")}
          disabled={callState !== "idle"}
          className="hover:text-blue-primary rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 disabled:opacity-50"
        >
          <Video className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
