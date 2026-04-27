"use client";

import { Mic, MicOff, Loader2, MicOffIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import type { SpeechStatus } from "@/features/speech/constants/speech";

interface Props {
  status: SpeechStatus;
  isSupported: boolean;
  onClick: () => void;
}

export function MicButton({ status, isSupported, onClick }: Props) {
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        title="Trình duyệt không hỗ trợ ghi âm"
        className="shrink-0 cursor-not-allowed rounded-full p-2 text-gray-300"
      >
        <Mic className="h-5 w-5" />
      </button>
    );
  }

  if (status === "permission-denied") {
    return (
      <button
        type="button"
        disabled
        title="Đã từ chối quyền microphone. Vào cài đặt trình duyệt → Site permissions để cấp lại quyền, sau đó refresh trang."
        aria-label="Quyền microphone bị từ chối"
        className="shrink-0 cursor-not-allowed rounded-full bg-red-50 p-2 text-red-400"
      >
        <MicOffIcon className="h-5 w-5" />
      </button>
    );
  }

  const isBusy = status === "requesting-token" || status === "requesting-mic";
  const isConnecting = status === "connecting";
  const isListening = status === "listening";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isListening ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
      className={cn(
        "shrink-0 rounded-full p-2 transition-colors",
        isListening && "animate-pulse bg-red-500 text-white hover:bg-red-600",
        !isListening &&
          !isBusy &&
          !isConnecting &&
          "hover:text-blue-primary text-gray-500 hover:bg-gray-100",
        (isBusy || isConnecting) && "cursor-wait text-gray-400",
      )}
    >
      {isListening ? (
        <MicOff className="h-5 w-5" />
      ) : isBusy || isConnecting ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  );
}
