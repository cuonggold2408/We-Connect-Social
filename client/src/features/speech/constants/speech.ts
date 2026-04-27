export const SPEECH_CONFIG = {
  SAMPLE_RATE: 16000,
  CHUNK_INTERVAL_MS: 100,

  MAX_SESSION_MS: 60000,

  KEEPALIVE_INTERVAL_MS: 8000,
} as const;

export type SpeechStatus =
  | "idle"
  | "requesting-token"
  | "requesting-mic"
  | "connecting"
  | "listening"
  | "stopping"
  | "error"
  | "permission-denied";

export const STATUS_TEXT_VI: Record<SpeechStatus, string> = {
  idle: "",
  "requesting-token": "Đang chuẩn bị...",
  "requesting-mic": "Đang xin quyền microphone...",
  connecting: "Đang kết nối...",
  listening: "Đang nghe...",
  stopping: "",
  error: "Đã có lỗi, click mic để thử lại",
  "permission-denied":
    "Đã từ chối quyền microphone. Vào Site settings của trình duyệt để cấp lại",
};
