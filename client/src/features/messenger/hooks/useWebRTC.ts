import { useCallStore } from "@/shared/stores/call.store";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
  iceCandidatePoolSize: 1,
};

export function useWebRTC(callSocketRef: React.RefObject<Socket | null>) {
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([]);
  const callSessionIdRef = useRef<string | null>(null);

  const callSessionId = useCallStore((s) => s.callSessionId);
  const callType = useCallStore((s) => s.callType);
  const isMuted = useCallStore((s) => s.isMuted);
  const isVideoOff = useCallStore((s) => s.isVideoOff);

  const getMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video:
        callType === "VIDEO"
          ? {
              width: { ideal: 1280 },
              height: { ideal: 720 },
              frameRate: { ideal: 60 },
            }
          : false,
    });
    localStream.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  }, [callType]);

  const createPC = useCallback(() => {
    const conn = new RTCPeerConnection(ICE_CONFIG);

    conn.onicecandidate = (e) => {
      const sid = callSessionIdRef.current;
      if (e.candidate && sid) {
        callSocketRef.current?.emit("webrtc-ice-candidate", {
          callSessionId: sid,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    conn.ontrack = (e) => {
      const stream = e.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
      setRemoteStream(stream);
      useCallStore.getState().setConnected();
    };

    conn.onconnectionstatechange = () => {
      if (conn.connectionState === "connected") {
        useCallStore.getState().setConnected();
      }
    };

    conn.oniceconnectionstatechange = () => {
      const state = conn.iceConnectionState;
      if (state === "connected" || state === "completed") {
        useCallStore.getState().setConnected();
      }
      if (state === "failed") {
        conn.restartIce();
      }
    };

    pc.current = conn;
    return conn;
  }, [callSocketRef]);

  const startCall = useCallback(async () => {
    const stream = await getMedia();
    const conn = createPC();
    stream.getTracks().forEach((t) => conn.addTrack(t, stream));

    const offer = await conn.createOffer();
    await conn.setLocalDescription(offer);

    const sid = callSessionIdRef.current;
    if (!sid) return;

    callSocketRef.current?.emit("webrtc-offer", {
      callSessionId: sid,
      sdp: offer,
    });
  }, [getMedia, createPC, callSocketRef]);

  const cleanup = useCallback(() => {
    localStream.current?.getTracks().forEach((t) => t.stop());
    pc.current?.close();
    localStream.current = null;
    pc.current = null;
    setRemoteStream(null);
  }, []);

  useEffect(() => {
    const socket = callSocketRef.current;
    if (!socket) return;
    const flushCandidates = async () => {
      const conn = pc.current;
      if (!conn || !conn.remoteDescription) return;
      for (const candidate of pendingCandidates.current) {
        await conn.addIceCandidate(new RTCIceCandidate(candidate));
      }
      pendingCandidates.current = [];
    };
    const onOffer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      const stream = await getMedia();
      const conn = createPC();
      stream.getTracks().forEach((t) => conn.addTrack(t, stream));
      await conn.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushCandidates();
      const answer = await conn.createAnswer();
      await conn.setLocalDescription(answer);
      socket.emit("webrtc-answer", { callSessionId, sdp: answer });
    };
    const onAnswer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      await pc.current?.setRemoteDescription(new RTCSessionDescription(sdp));
      await flushCandidates();
    };
    const onCandidate = async ({
      candidate,
    }: {
      candidate: RTCIceCandidateInit;
    }) => {
      if (pc.current?.remoteDescription) {
        await pc.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidates.current.push(candidate);
      }
    };
    socket.on("webrtc-offer", onOffer);
    socket.on("webrtc-answer", onAnswer);
    socket.on("webrtc-ice-candidate", onCandidate);
    return () => {
      socket.off("webrtc-offer", onOffer);
      socket.off("webrtc-answer", onAnswer);
      socket.off("webrtc-ice-candidate", onCandidate);
    };
  }, [callSocketRef, getMedia, createPC, callSessionId]);

  useEffect(() => {
    localStream.current?.getAudioTracks().forEach((t) => {
      t.enabled = !isMuted;
    });
  }, [isMuted]);

  useEffect(() => {
    localStream.current?.getVideoTracks().forEach((t) => {
      t.enabled = !isVideoOff;
    });
  }, [isVideoOff]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    callSessionIdRef.current = callSessionId;
  }, [callSessionId]);

  return { localVideoRef, remoteVideoRef, remoteStream, startCall, cleanup };
}
