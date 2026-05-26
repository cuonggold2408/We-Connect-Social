"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Languages,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { Textarea } from "@/shared/components/ui/textarea";
import { Switch } from "@/shared/components/ui/switch";
import { LANGUAGES } from "@/features/translation/constants/languages";
import { translateText } from "@/shared/api/translation.api";
import {
  suggestCallReply,
  type SuggestCallReplyResponse,
} from "@/shared/api/call-assist.api";
import { useCallAssistStore } from "@/shared/stores/call-assist.store";
import { useRemoteStreamingSTT } from "@/features/speech/hooks/useRemoteStreamingSTT";
import { cn } from "@/shared/lib/utils";

type Segment = {
  id: string;
  sourceText: string;
  translatedText?: string;
  status: "translating" | "ready" | "error";
  intentOpen?: boolean;
  intent?: string;
  suggestionStatus?: "idle" | "loading" | "ready" | "error";
  suggestion?: SuggestCallReplyResponse;
};

interface Props {
  conversationId: string;
  callSessionId?: string | null;
  remoteStream: MediaStream | null;
  onClose: () => void;
}

function normalizeForDedupe(text: string) {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

export function CallAssistPanel({
  conversationId,
  callSessionId,
  remoteStream,
  onClose,
}: Props) {
  const pref = useCallAssistStore(
    (s) =>
      s.byConversation[conversationId] ?? {
        enabled: false,
        remoteLang: "en",
        userLang: "vi",
      },
  );
  const setEnabled = useCallAssistStore((s) => s.setEnabled);
  const setRemoteLang = useCallAssistStore((s) => s.setRemoteLang);
  const setUserLang = useCallAssistStore((s) => s.setUserLang);

  const [activeLang, setActiveLang] = useState({
    remoteLang: pref.remoteLang,
    userLang: pref.userLang,
  });

  const [segments, setSegments] = useState<Segment[]>([]);
  const [interim, setInterim] = useState("");
  const [sttError, setSttError] = useState<string | null>(null);
  const lastFinalRef = useRef<{ text: string; at: number } | null>(null);
  const interimClearTimerRef = useRef<number | null>(null);

  const remoteLang = activeLang.remoteLang;
  const userLang = activeLang.userLang;

  const translateFinal = useCallback(
    async (id: string, text: string) => {
      try {
        const translated = await translateText({
          text,
          sourceLang: remoteLang,
          targetLang: userLang,
        });

        setSegments((items) =>
          items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  translatedText: translated.translatedText,
                  status: "ready",
                }
              : item,
          ),
        );
      } catch {
        setSegments((items) =>
          items.map((item) =>
            item.id === id ? { ...item, status: "error" } : item,
          ),
        );
      }
    },
    [remoteLang, userLang],
  );

  const onFinal = useCallback(
    (text: string) => {
      const cleaned = text.replace(/\s+/g, " ").trim();
      if (!cleaned) return;

      const normalized = normalizeForDedupe(cleaned);
      const now = Date.now();
      const last = lastFinalRef.current;

      if (last && last.text === normalized && now - last.at < 1500) {
        return;
      }
      lastFinalRef.current = { text: normalized, at: now };

      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      setInterim("");
      setSegments((items) => [
        ...items,
        {
          id,
          sourceText: cleaned,
          status: "translating",
          suggestionStatus: "idle",
        },
      ]);

      void translateFinal(id, cleaned);
    },
    [translateFinal],
  );

  const stt = useRemoteStreamingSTT({
    enabled: pref.enabled,
    language: remoteLang,
    mediaStream: remoteStream,
    onInterim: setInterim,
    onFinal,
    onError: (err) => setSttError(err.message),
  });

  const { status: sttStatus, start: startStt, stop: stopStt } = stt;

  useEffect(() => {
    if (!pref.enabled) return;

    const hasRemoteAudio = (remoteStream?.getAudioTracks().length ?? 0) > 0;
    if (!hasRemoteAudio) {
      return;
    }

    if (sttStatus === "idle") {
      void startStt();
    }
  }, [pref.enabled, remoteStream, sttStatus, startStt]);

  const suggestionMutation = useMutation({
    mutationFn: async ({
      segment,
      userIntent,
    }: {
      segment: Segment;
      userIntent?: string;
    }) => {
      const context = segments.slice(-3).map((item) => item.sourceText);
      return suggestCallReply({
        conversationId,
        callSessionId: callSessionId ?? undefined,
        originalSentence: segment.sourceText,
        remoteLang,
        userLang,
        recentContext: context,
        userIntent: userIntent?.trim() || undefined,
      });
    },
    onMutate: ({ segment }) => {
      setSegments((items) =>
        items.map((item) =>
          item.id === segment.id
            ? { ...item, suggestionStatus: "loading" }
            : item,
        ),
      );
    },
    onSuccess: (data, { segment }) => {
      setSegments((items) =>
        items.map((item) =>
          item.id === segment.id
            ? { ...item, suggestion: data, suggestionStatus: "ready" }
            : item,
        ),
      );
    },
    onError: (_err, { segment }) => {
      setSegments((items) =>
        items.map((item) =>
          item.id === segment.id
            ? { ...item, suggestionStatus: "error" }
            : item,
        ),
      );
    },
  });

  useEffect(() => {
    if (!interim) return;
    if (interimClearTimerRef.current) {
      window.clearTimeout(interimClearTimerRef.current);
    }
    interimClearTimerRef.current = window.setTimeout(() => {
      setInterim("");
    }, 2500);
    return () => {
      if (interimClearTimerRef.current) {
        window.clearTimeout(interimClearTimerRef.current);
        interimClearTimerRef.current = null;
      }
    };
  }, [interim]);

  const statusText = useMemo(() => {
    if (!pref.enabled)
      return "Bật trợ lý cuộc gọi để nghe và dịch lời đối phương";
    if (!remoteStream?.getAudioTracks().length) {
      return "Đang chờ âm thanh từ đối phương...";
    }
    if (sttStatus === "connecting" || sttStatus === "requesting-token") {
      return "Đang kết nối nhận diện giọng nói...";
    }
    if (sttStatus === "error") return sttError ?? "STT gặp lỗi";
    if (interim) return "Đang nhận diện...";
    return "Listening...";
  }, [interim, pref.enabled, remoteStream, sttStatus, sttError]);

  const hasPendingLanguageChange =
    pref.remoteLang !== remoteLang || pref.userLang !== userLang;

  return (
    <div className="absolute top-16 right-4 bottom-24 z-20 flex w-[620px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/95 text-gray-900 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-sky-100 p-2 text-sky-700">
            <Languages className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Call Assist</p>
            <p className="text-xs text-gray-500">{statusText}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Switch
            checked={pref.enabled}
            onCheckedChange={(checked) => {
              if (checked) {
                setActiveLang({
                  remoteLang: pref.remoteLang,
                  userLang: pref.userLang,
                });
                setSttError(null);
              } else {
                stopStt();
                setInterim("");
                setSttError(null);
              }

              setEnabled(conversationId, checked);
            }}
          />
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 border-b border-gray-100 px-4 py-2 text-xs">
        <div className="pr-3">
          <p className="mb-1 font-medium text-gray-600">Đối phương nói</p>
          <select
            value={pref.remoteLang}
            onChange={(e) => {
              const value = e.target.value;
              setRemoteLang(conversationId, value);
              if (!pref.enabled) {
                setActiveLang((prev) => ({ ...prev, remoteLang: value }));
              }
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.labelVi}
              </option>
            ))}
          </select>
        </div>
        <div className="border-l border-gray-100 pl-3">
          <p className="mb-1 font-medium text-gray-600">Tôi hiểu bằng</p>
          <select
            value={pref.userLang}
            onChange={(e) => {
              const value = e.target.value;
              setUserLang(conversationId, value);
              if (!pref.enabled) {
                setActiveLang((prev) => ({ ...prev, userLang: value }));
              }
            }}
            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.labelVi}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasPendingLanguageChange && (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-700">
          Thay đổi ngôn ngữ sẽ áp dụng từ lần bật Call Assist hoặc cuộc gọi tiếp
          theo
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-2">
        <ScrollArea className="min-h-0 border-r border-gray-100">
          <div className="space-y-3 p-4">
            {segments.length === 0 && !interim && (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                Bản dịch lời đối phương sẽ xuất hiện ở đây
              </div>
            )}

            {segments.map((segment) => (
              <div key={segment.id} className="rounded-xl border bg-white p-3">
                <div className="flex items-start gap-2">
                  <MessageSquareText className="mt-0.5 h-4 w-4 text-sky-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {segment.sourceText}
                    </p>

                    <div className="mt-2 text-sm text-gray-600">
                      {segment.status === "translating" && (
                        <span className="inline-flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Đang dịch...
                        </span>
                      )}
                      {segment.status === "error" && (
                        <button
                          type="button"
                          onClick={() =>
                            void translateFinal(segment.id, segment.sourceText)
                          }
                          className="text-orange-600 hover:underline"
                        >
                          Dịch lỗi. Thử lại
                        </button>
                      )}
                      {segment.status === "ready" && segment.translatedText}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        size="xs"
                        type="button"
                        onClick={() => suggestionMutation.mutate({ segment })}
                        disabled={segment.suggestionStatus === "loading"}
                      >
                        {segment.suggestionStatus === "loading" ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        Gợi ý trả lời
                      </Button>

                      <Button
                        size="xs"
                        type="button"
                        variant="ghost"
                        onClick={() =>
                          setSegments((items) =>
                            items.map((item) =>
                              item.id === segment.id
                                ? { ...item, intentOpen: !item.intentOpen }
                                : item,
                            ),
                          )
                        }
                      >
                        Thêm ý
                      </Button>
                    </div>

                    {segment.intentOpen && (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          value={segment.intent ?? ""}
                          onChange={(e) =>
                            setSegments((items) =>
                              items.map((item) =>
                                item.id === segment.id
                                  ? { ...item, intent: e.target.value }
                                  : item,
                              ),
                            )
                          }
                          placeholder="Ví dụ: Hà nội là thủ đô của Việt Nam"
                          className="min-h-16 text-sm"
                        />
                        <Button
                          size="xs"
                          type="button"
                          onClick={() =>
                            suggestionMutation.mutate({
                              segment,
                              userIntent: segment.intent,
                            })
                          }
                        >
                          Tạo theo ý của tôi
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {interim && (
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-3 text-sm text-sky-800 italic">
                {interim}
              </div>
            )}
          </div>
        </ScrollArea>

        <ScrollArea className="min-h-0">
          <div className="space-y-3 p-4">
            {segments.every((s) => !s.suggestion) && (
              <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-500">
                Gợi ý trả lời sẽ xuất hiện ở đây sau khi bạn chọn “Gợi ý trả
                lời”
              </div>
            )}

            {segments
              .filter((s) => s.suggestion || s.suggestionStatus === "error")
              .map((segment) => (
                <div
                  key={`suggestion-${segment.id}`}
                  className={cn(
                    "rounded-xl border p-3",
                    segment.suggestionStatus === "error"
                      ? "border-orange-200 bg-orange-50"
                      : "bg-white",
                  )}
                >
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Bot className="h-4 w-4 text-violet-600" />
                    Câu trả lời gợi ý
                  </div>

                  {segment.suggestionStatus === "error" && (
                    <div className="space-y-2 text-sm text-orange-700">
                      <p>Không tạo được gợi ý</p>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          suggestionMutation.mutate({
                            segment,
                            userIntent: segment.intent,
                          })
                        }
                      >
                        <RefreshCw className="h-3 w-3" />
                        Thử lại
                      </Button>
                    </div>
                  )}

                  {segment.suggestion && (
                    <div className="space-y-3">
                      <div>
                        <p className="mb-1 text-xs font-medium text-gray-400 uppercase">
                          Câu trả lời
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                          {segment.suggestion.suggestedReply}
                        </p>
                      </div>
                      <div className="rounded-lg bg-gray-50 p-2">
                        <p className="mb-1 text-xs font-medium text-gray-400 uppercase">
                          Dịch câu trả lời
                        </p>
                        <p className="text-sm text-gray-600">
                          {segment.suggestion.translatedReply}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
