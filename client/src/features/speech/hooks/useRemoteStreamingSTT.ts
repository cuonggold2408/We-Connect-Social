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
  type?: string;
};

interface Args {
  language: string;
  mediaStream: MediaStream | null;
  enabled: boolean;
  onInterim?: (text: string) => void;
  onFinal?: (text: string, confidence?: number) => void;
  onError?: (error: Error) => void;
}

export function useRemoteStreamingSTT({
  language,
  mediaStream,
  enabled,
  onInterim,
  onFinal,
  onError,
}: Args) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const [error, setError] = useState<Error | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const workletRef = useRef<AudioWorkletNode | null>(null);
  const keepaliveRef = useRef<number | null>(null);
  const stoppedRef = useRef(true);
  const callbacksRef = useRef({ onInterim, onFinal, onError });

  useEffect(() => {
    callbacksRef.current = { onInterim, onFinal, onError };
  });

  const isSupported =
    typeof window !== "undefined" &&
    typeof window.AudioContext !== "undefined" &&
    typeof window.AudioWorkletNode !== "undefined" &&
    typeof window.WebSocket !== "undefined";

  const cleanup = useCallback(() => {
    if (keepaliveRef.current) window.clearInterval(keepaliveRef.current);
    keepaliveRef.current = null;

    try {
      workletRef.current?.port.close();
      workletRef.current?.disconnect();
      sourceRef.current?.disconnect();
    } catch {}

    workletRef.current = null;
    sourceRef.current = null;

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
        ws.close(1000, "client-stopped");
      } catch {}
    }
  }, []);

  const fail = useCallback(
    (err: Error) => {
      stoppedRef.current = true;
      setError(err);
      setStatus("error");
      callbacksRef.current.onError?.(err);
      cleanup();
    },
    [cleanup],
  );

  const stop = useCallback(() => {
    stoppedRef.current = true;
    setStatus("stopping");
    cleanup();
    setStatus("idle");
  }, [cleanup]);

  const start = useCallback(async () => {
    if (!enabled) return;

    if (!isSupported) {
      fail(new Error("Trình duyệt không hỗ trợ nhận diện giọng nói realtime"));
      return;
    }

    const audioTracks = mediaStream?.getAudioTracks() ?? [];
    if (!mediaStream || audioTracks.length === 0) {
      fail(new Error("Chưa nhận được âm thanh từ đối phương"));
      return;
    }

    if (!stoppedRef.current && status !== "idle" && status !== "error") return;

    stoppedRef.current = false;
    setError(null);

    try {
      setStatus("requesting-token");
      const token = await getSpeechToken();

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
        endpointing: "999",
        vad_events: "true",
        keyterm: "50",
      });

      setStatus("connecting");
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

        setStatus("listening");

        const source = audioCtx.createMediaStreamSource(mediaStream);
        sourceRef.current = source;

        const samplesPerChunk =
          (SPEECH_CONFIG.SAMPLE_RATE * SPEECH_CONFIG.CHUNK_INTERVAL_MS) / 1000;

        const worklet = new AudioWorkletNode(audioCtx, "pcm-processor");
        workletRef.current = worklet;
        worklet.port.postMessage({ type: "config", samplesPerChunk });

        worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
          const current = wsRef.current;
          if (current?.readyState === WebSocket.OPEN) {
            current.send(e.data);
          }
        };

        source.connect(worklet);

        keepaliveRef.current = window.setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "KeepAlive" }));
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
      fail(err instanceof Error ? err : new Error(String(err)));
    }
  }, [enabled, fail, isSupported, language, mediaStream, status, stop]);

  useEffect(() => {
    if (!enabled) {
      stoppedRef.current = true;
      cleanup();
    }

    return () => {
      stoppedRef.current = true;
      cleanup();
    };
  }, [cleanup, enabled]);

  return {
    status,
    error,
    isListening: status === "listening",
    isSupported,
    start,
    stop,
  };
}
