import { create } from "zustand";

type CallState =
  | "idle"
  | "outgoing-ringing"
  | "incoming-ringing"
  | "connecting"
  | "connected"
  | "ended";

interface CallUser {
  id: string;
  username: string;
  fullname: string | null;
  avatarUrl: string | null;
}

interface CallStoreState {
  callState: CallState;
  callSessionId: string | null;
  callType: "AUDIO" | "VIDEO" | null;
  conversationId: string | null;
  remoteUser: CallUser | null;
  isMuted: boolean;
  isVideoOff: boolean;
  duration: number;
  role: "caller" | "callee" | null;
  isInitiating: boolean;
}

interface CallStoreActions {
  startOutgoingCall: (data: {
    callType: "AUDIO" | "VIDEO";
    conversationId: string;
    remoteUser: CallUser;
  }) => void;
  setCallSessionId: (callSessionId: string) => void;
  receiveIncomingCall: (data: {
    callSessionId: string;
    callType: "AUDIO" | "VIDEO";
    conversationId: string;
    remoteUser: CallUser;
  }) => void;
  setConnecting: () => void;
  setConnected: () => void;
  setInitiating: (v: boolean) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  setDuration: (d: number) => void;
  reset: () => void;
}

const initialState: CallStoreState = {
  callState: "idle",
  callSessionId: null,
  callType: null,
  conversationId: null,
  remoteUser: null,
  isMuted: false,
  isVideoOff: false,
  duration: 0,
  role: null,
  isInitiating: false,
};

export const useCallStore = create<CallStoreState & CallStoreActions>(
  (set) => ({
    ...initialState,

    startOutgoingCall: (data) =>
      set({
        callState: "outgoing-ringing",
        role: "caller",
        callSessionId: null,
        ...data,
        isMuted: false,
        isVideoOff: false,
        duration: 0,
        isInitiating: false,
      }),

    setInitiating: (v) => set({ isInitiating: v }),

    setCallSessionId: (callSessionId) => set({ callSessionId }),

    receiveIncomingCall: (data) =>
      set({ callState: "incoming-ringing", role: "callee", ...data }),

    setConnecting: () => set({ callState: "connecting" }),
    setConnected: () => set({ callState: "connected" }),
    endCall: () => set({ callState: "ended" }),
    toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
    toggleVideo: () => set((s) => ({ isVideoOff: !s.isVideoOff })),
    setDuration: (d) => set({ duration: d }),
    reset: () => set(initialState),
  }),
);
