"use client";

import { useCallStore } from "@/shared/stores/call.store";
import { Phone, PhoneOff, Video } from "lucide-react";
import type { Socket } from "socket.io-client";
import Image from "next/image";
import { DEFAULT_AVATAR_URL } from "@/shared/helpers/constants";

interface Props {
  callSocketRef: React.RefObject<Socket | null>;
}

export function IncomingCallDialog({ callSocketRef }: Props) {
  const callSessionId = useCallStore((s) => s.callSessionId);
  const callType = useCallStore((s) => s.callType);
  const remoteUser = useCallStore((s) => s.remoteUser);

  const handleAccept = () => {
    callSocketRef.current?.emit("call-accept", { callSessionId });
    useCallStore.getState().setConnecting();
  };

  const handleReject = () => {
    callSocketRef.current?.emit("call-reject", { callSessionId });
    useCallStore.getState().reset();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-80 rounded-2xl bg-white p-6 text-center shadow-2xl">
        <Image
          src={remoteUser?.avatarUrl ?? DEFAULT_AVATAR_URL}
          alt={remoteUser?.fullname ?? remoteUser?.username ?? "Người gọi"}
          width={40}
          height={40}
          priority
          className="mx-auto h-20 w-20 rounded-full object-cover"
        />
        <p className="mt-3 text-lg font-semibold text-gray-900">
          {remoteUser?.fullname ?? remoteUser?.username ?? "Người gọi"}
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {callType === "VIDEO"
            ? "Cuộc gọi video đến..."
            : "Cuộc gọi thoại đến..."}
        </p>

        <div className="mt-6 flex items-center justify-center gap-6">
          <button
            onClick={handleReject}
            className="rounded-full bg-red-500 p-4 text-white transition-colors hover:bg-red-600"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
          <button
            onClick={handleAccept}
            className="rounded-full bg-green-500 p-4 text-white transition-colors hover:bg-green-600"
          >
            {callType === "VIDEO" ? (
              <Video className="h-6 w-6" />
            ) : (
              <Phone className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
