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

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_DELAY_MS = 1000;
const WS_OPEN_TIMEOUT_MS = 7000;
const WS_BUFFERED_HIGH_WATER = 256 * 1024;
const HEALTH_CHECK_INTERVAL_MS = 5000;
const STUCK_THRESHOLD_MS = 10000;

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
  const silentGainRef = useRef<GainNode | null>(null);
  const keepaliveRef = useRef<number | null>(null);
  const healthCheckRef = useRef<number | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const stoppedRef = useRef(true);
  const lastResultAtRef = useRef(0);
  const chunksSentRef = useRef(0);
  const languageRef = useRef(language);
  const mediaStreamRef = useRef<MediaStream | null>(mediaStream);
  const callbacksRef = useRef({ onInterim, onFinal, onError });

  useEffect(() => {
    callbacksRef.current = { onInterim, onFinal, onError };
  });

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    mediaStreamRef.current = mediaStream;
  }, [mediaStream]);

  const isSupported =
    typeof window !== "undefined" &&
    typeof window.AudioContext !== "undefined" &&
    typeof window.AudioWorkletNode !== "undefined" &&
    typeof window.WebSocket !== "undefined";

  const teardownAudio = useCallback(() => {
    if (keepaliveRef.current) {
      window.clearInterval(keepaliveRef.current);
      keepaliveRef.current = null;
    }
    if (healthCheckRef.current) {
      window.clearInterval(healthCheckRef.current);
      healthCheckRef.current = null;
    }

    try {
      workletRef.current?.port.close();
      workletRef.current?.disconnect();
      silentGainRef.current?.disconnect();
      sourceRef.current?.disconnect();
    } catch {}

    workletRef.current = null;
    silentGainRef.current = null;
    sourceRef.current = null;

    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
  }, []);

  const teardownWs = useCallback(() => {
    const ws = wsRef.current;
    wsRef.current = null;
    if (!ws) return;
    try {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "CloseStream" }));
      }
      ws.close(1000, "client-stopped");
    } catch {}
  }, []);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    teardownAudio();
    teardownWs();
  }, [teardownAudio, teardownWs]);

  const fail = useCallback(
    (err: Error) => {
      stoppedRef.current = true;
      reconnectAttemptsRef.current = 0;
      setError(err);
      setStatus("error");
      callbacksRef.current.onError?.(err);
      cleanup();
    },
    [cleanup],
  );

  const stop = useCallback(() => {
    stoppedRef.current = true;
    reconnectAttemptsRef.current = 0;
    setStatus("stopping");
    cleanup();
    setStatus("idle");
  }, [cleanup]);

  const connectRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const scheduleReconnect = useCallback(
    (reason: string) => {
      if (stoppedRef.current) return;
      if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
        fail(new Error("Mất kết nối nhận diện giọng nói, vui lòng thử lại"));
        return;
      }

      const attempt = reconnectAttemptsRef.current;
      reconnectAttemptsRef.current += 1;
      const delay = RECONNECT_BASE_DELAY_MS * 2 ** attempt;

      teardownAudio();
      teardownWs();
      setStatus("connecting");

      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        void connectRef.current();
      }, delay);
    },
    [fail, teardownAudio, teardownWs],
  );

  const connect = useCallback(async () => {
    if (stoppedRef.current) return;

    const stream = mediaStreamRef.current;
    const audioTracks = stream?.getAudioTracks() ?? [];
    if (!stream || audioTracks.length === 0) {
      fail(new Error("Chưa nhận được âm thanh từ đối phương"));
      return;
    }

    try {
      setStatus("requesting-token");
      const token = await getSpeechToken();
      if (stoppedRef.current) return;

      const audioCtx = new AudioContext({
        sampleRate: SPEECH_CONFIG.SAMPLE_RATE,
      });
      audioCtxRef.current = audioCtx;

      audioCtx.onstatechange = () => {
        if (audioCtx.state === "suspended" && !stoppedRef.current) {
          audioCtx.resume().catch(() => {});
        }
      };

      await audioCtx.audioWorklet.addModule(getPcmWorkletUrl());
      if (stoppedRef.current) return;

      const params = new URLSearchParams({
        model: token.model,
        language: languageRef.current,
        encoding: "linear16",
        sample_rate: String(SPEECH_CONFIG.SAMPLE_RATE),
        channels: "1",
        interim_results: "true",
        smart_format: "true",
        punctuate: "true",
        endpointing: "400",
        vad_events: "true",
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
          try {
            ws.close();
          } catch {}
          scheduleReconnect("open-timeout");
        }
      }, WS_OPEN_TIMEOUT_MS);

      ws.onopen = () => {
        window.clearTimeout(openTimeout);
        if (stoppedRef.current) {
          ws.close();
          return;
        }

        reconnectAttemptsRef.current = 0;
        chunksSentRef.current = 0;
        lastResultAtRef.current = Date.now();
        setStatus("listening");

        const source = audioCtx.createMediaStreamSource(stream);
        sourceRef.current = source;

        const samplesPerChunk =
          (SPEECH_CONFIG.SAMPLE_RATE * SPEECH_CONFIG.CHUNK_INTERVAL_MS) / 1000;

        const worklet = new AudioWorkletNode(audioCtx, "pcm-processor");
        workletRef.current = worklet;
        worklet.port.postMessage({ type: "config", samplesPerChunk });

        const silentGain = audioCtx.createGain();
        silentGain.gain.value = 0;
        silentGainRef.current = silentGain;

        worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
          const current = wsRef.current;
          if (!current || current.readyState !== WebSocket.OPEN) return;
          if (current.bufferedAmount > WS_BUFFERED_HIGH_WATER) return;
          current.send(e.data);
          chunksSentRef.current += 1;
        };

        source.connect(worklet);
        worklet.connect(silentGain);
        silentGain.connect(audioCtx.destination);

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          audioTrack.onmute = () => {
            if (!stoppedRef.current) scheduleReconnect("track-ended");
          };
          audioTrack.onunmute = () => {
            if (!stoppedRef.current) scheduleReconnect("track-ended");
          };
          audioTrack.onended = () => {
            if (!stoppedRef.current) scheduleReconnect("track-ended");
          };
        }

        keepaliveRef.current = window.setInterval(() => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "KeepAlive" }));
          }
        }, SPEECH_CONFIG.KEEPALIVE_INTERVAL_MS);

        healthCheckRef.current = window.setInterval(() => {
          const idleMs = Date.now() - lastResultAtRef.current;

          const wsState = wsRef.current?.readyState;
          const sentSnapshot = chunksSentRef.current;
          chunksSentRef.current = 0;

          if (sentSnapshot === 0 && wsState === WebSocket.OPEN) {
            scheduleReconnect("worklet-stalled");
            return;
          }
          if (idleMs > STUCK_THRESHOLD_MS && wsState === WebSocket.OPEN) {
            scheduleReconnect("deepgram-stuck");
          }
        }, HEALTH_CHECK_INTERVAL_MS);
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

        lastResultAtRef.current = Date.now();

        const alt = parsed.channel?.alternatives?.[0];
        const text = alt?.transcript?.trim() ?? "";
        if (!text) return;

        if (parsed.is_final) {
          callbacksRef.current.onFinal?.(text, alt?.confidence);
        } else {
          callbacksRef.current.onInterim?.(text);
        }
      };

      ws.onclose = (event) => {
        window.clearTimeout(openTimeout);
        if (stoppedRef.current) return;
        scheduleReconnect(`ws-close-${event.code}`);
      };
    } catch (err) {
      if (stoppedRef.current) return;
      const e = err instanceof Error ? err : new Error(String(err));
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        scheduleReconnect("connect-error");
      } else {
        fail(e);
      }
    }
  }, [fail, scheduleReconnect]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const start = useCallback(async () => {
    if (!enabled) return;
    if (!isSupported) {
      fail(new Error("Trình duyệt không hỗ trợ nhận diện giọng nói realtime"));
      return;
    }
    if (!stoppedRef.current) return;

    stoppedRef.current = false;
    reconnectAttemptsRef.current = 0;
    setError(null);
    await connect();
  }, [connect, enabled, fail, isSupported]);

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
