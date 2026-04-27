"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSpeechToken } from "@/shared/api/speech.api";
import { getPcmWorkletUrl } from "@/features/speech/lib/pcm-worklet";
import {
  SPEECH_CONFIG,
  type SpeechStatus,
} from "@/features/speech/constants/speech";

type DeepgramTranscript = {
  channel?: {
    alternatives?: Array<{ transcript?: string; confidence?: number }>;
  };
  is_final?: boolean;
  speech_final?: boolean;
  type?: string;
};

interface UseStreamingSTTOptions {
  language: string;
  onInterim?: (text: string) => void;
  onFinal?: (text: string, confidence?: number) => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: SpeechStatus) => void;
}

interface UseStreamingSTTReturn {
  status: SpeechStatus;
  isListening: boolean;
  isSupported: boolean;
  start: () => Promise<void>;
  stop: () => void;
  error: Error | null;
}

export function useStreamingSTT({
  language,
  onInterim,
  onFinal,
  onError,
  onStatusChange,
}: UseStreamingSTTOptions): UseStreamingSTTReturn {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hardTimeoutRef = useRef<number | null>(null);
  const keepaliveRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);
  const permissionDeniedRef = useRef(false);

  const callbacksRef = useRef({ onInterim, onFinal, onError, onStatusChange });
  useEffect(() => {
    callbacksRef.current = { onInterim, onFinal, onError, onStatusChange };
  });

  const isSupported =
    typeof window !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof window.AudioContext !== "undefined" &&
    typeof window.AudioWorkletNode !== "undefined" &&
    typeof window.WebSocket !== "undefined";

  const updateStatus = useCallback((s: SpeechStatus) => {
    setStatus(s);
    callbacksRef.current.onStatusChange?.(s);
  }, []);

  const cleanup = useCallback(() => {
    if (hardTimeoutRef.current !== null) {
      window.clearTimeout(hardTimeoutRef.current);
      hardTimeoutRef.current = null;
    }
    if (keepaliveRef.current !== null) {
      window.clearInterval(keepaliveRef.current);
      keepaliveRef.current = null;
    }

    try {
      workletRef.current?.port.close();
      workletRef.current?.disconnect();
    } catch {}
    workletRef.current = null;

    try {
      sourceRef.current?.disconnect();
    } catch {}
    sourceRef.current = null;

    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;

    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;

    const ws = wsRef.current;
    wsRef.current = null;
    if (ws) {
      try {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "CloseStream" }));
        }
      } catch {}
      try {
        ws.close(1000, "client-stopped");
      } catch {}
    }
  }, []);

  const fail = useCallback(
    (err: Error) => {
      stoppedRef.current = true;
      setError(err);
      updateStatus("error");
      callbacksRef.current.onError?.(err);
      cleanup();
    },
    [cleanup, updateStatus],
  );

  const failPermissionDenied = useCallback(
    (err: Error) => {
      stoppedRef.current = true;
      permissionDeniedRef.current = true;
      setError(err);
      updateStatus("permission-denied");
      callbacksRef.current.onError?.(err);
      cleanup();
    },
    [cleanup, updateStatus],
  );

  const stop = useCallback(() => {
    if (stoppedRef.current) return;
    stoppedRef.current = true;
    updateStatus("stopping");
    cleanup();
    updateStatus("idle");
  }, [cleanup, updateStatus]);

  const start = useCallback(async () => {
    if (!isSupported) {
      fail(new Error("Trình duyệt không hỗ trợ ghi âm streaming"));
      return;
    }

    if (permissionDeniedRef.current) {
      callbacksRef.current.onError?.(
        new Error(
          "Đã từ chối quyền microphone. Vào cài đặt trình duyệt để cấp lại",
        ),
      );
      return;
    }

    if (!stoppedRef.current && status !== "idle" && status !== "error") return;

    stoppedRef.current = false;
    setError(null);

    try {
      updateStatus("requesting-token");
      const token = await getSpeechToken();

      updateStatus("requesting-mic");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      if (stoppedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;

      const audioCtx = new AudioContext({
        sampleRate: SPEECH_CONFIG.SAMPLE_RATE,
      });
      audioCtxRef.current = audioCtx;
      await audioCtx.audioWorklet.addModule(getPcmWorkletUrl());
      if (stoppedRef.current) return;

      const params = new URLSearchParams({
        model: token.model,
        language,
        encoding: "linear16",
        sample_rate: String(SPEECH_CONFIG.SAMPLE_RATE),
        channels: "1",
        interim_results: "true",
        smart_format: "true",
        punctuate: "true",
        endpointing: "300",
        vad_events: "true",
      });

      updateStatus("connecting");
      const ws = new WebSocket(`${token.websocketUrl}?${params.toString()}`, [
        "bearer",
        token.accessToken,
      ]);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      const openTimeout = window.setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          fail(new Error("Kết nối Deepgram quá thời gian"));
        }
      }, 7000);

      ws.onopen = () => {
        window.clearTimeout(openTimeout);
        if (stoppedRef.current) {
          ws.close();
          return;
        }
        updateStatus("listening");

        const samplesPerChunk =
          (SPEECH_CONFIG.SAMPLE_RATE * SPEECH_CONFIG.CHUNK_INTERVAL_MS) / 1000;
        const source = audioCtx.createMediaStreamSource(stream);
        sourceRef.current = source;
        const worklet = new AudioWorkletNode(audioCtx, "pcm-processor");
        workletRef.current = worklet;
        worklet.port.postMessage({ type: "config", samplesPerChunk });

        worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
          const w = wsRef.current;
          if (!w || w.readyState !== WebSocket.OPEN) return;
          w.send(e.data);
        };

        source.connect(worklet);

        hardTimeoutRef.current = window.setTimeout(() => {
          stop();
        }, SPEECH_CONFIG.MAX_SESSION_MS);

        keepaliveRef.current = window.setInterval(() => {
          const w = wsRef.current;
          if (w?.readyState === WebSocket.OPEN) {
            w.send(JSON.stringify({ type: "KeepAlive" }));
          }
        }, SPEECH_CONFIG.KEEPALIVE_INTERVAL_MS);
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        let parsed: DeepgramTranscript;
        try {
          parsed = JSON.parse(event.data);
        } catch {
          return;
        }
        if (parsed.type !== "Results") return;

        const alt = parsed.channel?.alternatives?.[0];
        const text = alt?.transcript?.trim() ?? "";
        if (!text) return;

        if (parsed.is_final) {
          callbacksRef.current.onFinal?.(text, alt?.confidence);
        } else {
          callbacksRef.current.onInterim?.(text);
        }
      };

      ws.onerror = () => {
        fail(new Error("Mất kết nối tới dịch vụ nhận diện giọng nói"));
      };

      ws.onclose = (event) => {
        if (stoppedRef.current) return;
        if (event.code === 1006 || event.code === 1011) {
          fail(new Error(`Deepgram đóng kết nối (code ${event.code})`));
        } else {
          stop();
        }
      };
    } catch (err) {
      const e = err as Error;
      if (e.name === "NotAllowedError" || e.name === "PermissionDeniedError") {
        failPermissionDenied(
          new Error("Bạn đã từ chối quyền truy cập microphone"),
        );
      } else if (e.name === "NotFoundError") {
        fail(new Error("Không tìm thấy thiết bị microphone"));
      } else {
        fail(e instanceof Error ? e : new Error(String(e)));
      }
    }
  }, [
    isSupported,
    language,
    status,
    updateStatus,
    fail,
    stop,
    failPermissionDenied,
  ]);

  useEffect(() => {
    return () => {
      stoppedRef.current = true;
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && !stoppedRef.current) {
        stop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [stop]);

  return {
    status,
    isListening: status === "listening",
    isSupported,
    start,
    stop,
    error,
  };
}
