"use client";

import { useCallStore } from "@/shared/stores/call.store";
import { useWebRTC } from "@/features/messenger/hooks/useWebRTC";
import { useEffect, useRef } from "react";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { Socket } from "socket.io-client";
import Image from "next/image";
import { DEFAULT_AVATAR_URL } from "@/shared/helpers/constants";

interface Props {
  callSocketRef: React.RefObject<Socket | null>;
}

export function VideoCallModal({ callSocketRef }: Props) {
  const callState = useCallStore((s) => s.callState);
  const callType = useCallStore((s) => s.callType);
  const callSessionId = useCallStore((s) => s.callSessionId);
  const remoteUser = useCallStore((s) => s.remoteUser);
  const isMuted = useCallStore((s) => s.isMuted);
  const isVideoOff = useCallStore((s) => s.isVideoOff);
  const duration = useCallStore((s) => s.duration);
  const toggleMute = useCallStore((s) => s.toggleMute);
  const toggleVideo = useCallStore((s) => s.toggleVideo);
  const role = useCallStore((s) => s.role);

  const { localVideoRef, remoteVideoRef, startCall, cleanup } =
    useWebRTC(callSocketRef);

  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (callState === "connecting" && role === "caller" && callSessionId) {
      startCall();
    }
  }, [callState, role, startCall, callSessionId]);

  useEffect(() => {
    if (callState === "connected") {
      durationInterval.current = setInterval(() => {
        useCallStore
          .getState()
          .setDuration(useCallStore.getState().duration + 1);
      }, 1000);
    }
    return () => {
      if (durationInterval.current) clearInterval(durationInterval.current);
    };
  }, [callState]);

  const handleEndCall = () => {
    callSocketRef.current?.emit("call-end", { callSessionId });
    cleanup();
    if (durationInterval.current) clearInterval(durationInterval.current);
    useCallStore.getState().endCall();
    setTimeout(() => useCallStore.getState().reset(), 1500);
  };

  const formatDuration = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    return () => {
      cleanup();
      if (durationInterval.current) clearInterval(durationInterval.current);
    };
  }, [cleanup]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="relative h-full w-full max-w-4xl">
        {callType === "VIDEO" ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center">
            <audio
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="sr-only"
              aria-hidden
            />
            <Image
              src={remoteUser?.avatarUrl ?? DEFAULT_AVATAR_URL}
              alt={remoteUser?.fullname ?? remoteUser?.username ?? "Người gọi"}
              className="h-32 w-32 rounded-full object-cover"
              width={40}
              height={40}
              priority
            />
            <p className="mt-4 text-xl font-semibold text-white">
              {remoteUser?.fullname ?? remoteUser?.username ?? "Người gọi"}
            </p>
          </div>
        )}

        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
          <p className="text-sm text-white/80">
            {callState === "outgoing-ringing" && "Đang đổ chuông..."}
            {callState === "connecting" && "Đang kết nối..."}
            {callState === "connected" && formatDuration(duration)}
            {callState === "ended" && "Cuộc gọi đã kết thúc"}
          </p>
        </div>

        {callType === "VIDEO" && (
          <div className="absolute right-4 bottom-24 h-40 w-28 overflow-hidden rounded-xl border-2 border-white/20 shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-4">
          <button
            onClick={toggleMute}
            className={cn(
              "rounded-full p-4 transition-colors",
              isMuted ? "bg-red-500 text-white" : "bg-white/20 text-white",
            )}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6" />
            ) : (
              <Mic className="h-6 w-6" />
            )}
          </button>

          {callType === "VIDEO" && (
            <button
              onClick={toggleVideo}
              className={cn(
                "rounded-full p-4 transition-colors",
                isVideoOff ? "bg-red-500 text-white" : "bg-white/20 text-white",
              )}
            >
              {isVideoOff ? (
                <VideoOff className="h-6 w-6" />
              ) : (
                <Video className="h-6 w-6" />
              )}
            </button>
          )}

          <button
            onClick={handleEndCall}
            className="rounded-full bg-red-500 p-4 text-white transition-colors hover:bg-red-600"
          >
            <PhoneOff className="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
