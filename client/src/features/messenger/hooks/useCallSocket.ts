import { useAuthStore } from "@/shared/stores/auth.store";
import { useCallStore } from "@/shared/stores/call.store";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";

export function useCallSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (socketRef.current?.connected) return;

    const socket = io(`${process.env.NEXT_PUBLIC_API_URL}/call`, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on(
      "call-initiated",
      ({ callSession }: { callSession: { id: string } }) => {
        useCallStore.getState().setCallSessionId(callSession.id);
      },
    );

    socket.on("incoming-call", ({ callSession }) => {
      const currentState = useCallStore.getState().callState;
      if (currentState !== "idle") {
        socket.emit("call-reject", { callSessionId: callSession.id });
        return;
      }

      useCallStore.getState().receiveIncomingCall({
        callSessionId: callSession.id,
        callType: callSession.type,
        conversationId: callSession.conversationId,
        remoteUser: callSession.caller,
      });
    });

    socket.on("call-accepted", () => {
      useCallStore.getState().setConnecting();
    });

    socket.on("call-rejected", () => {
      useCallStore.getState().reset();
    });

    socket.on("call-ended", () => {
      useCallStore.getState().endCall();
      setTimeout(() => useCallStore.getState().reset(), 2000);
    });

    socket.on("call-busy", () => {
      useCallStore.getState().reset();
    });

    socket.on("call-timeout", () => {
      useCallStore.getState().reset();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated]);

  return socketRef;
}
