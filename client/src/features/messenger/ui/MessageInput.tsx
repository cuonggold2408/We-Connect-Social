"use client";

import { useState, useRef } from "react";
import { Send, Image as ImageIcon } from "lucide-react";
import { uploadSingleImage } from "@/shared/helpers/upload-single-image";
import { toast } from "sonner";
import { ComposeTranslationPill } from "@/features/translation/ui/ComposeTranslationPill";
import { useComposePreference } from "@/features/translation/hooks/useComposePreference";
import { useComposeTranslate } from "@/features/translation/hooks/useComposeTranslate";
import { ComposeLanguagePopover } from "@/features/translation/ui/ComposeLanguagePopover";
import { useStreamingSTT } from "@/features/speech/hooks/useStreamingSTT";
import { MicButton } from "@/features/speech/ui/MicButton";
import { STATUS_TEXT_VI } from "@/features/speech/constants/speech";

interface Props {
  conversationId: string;
  onSend: (
    content: string,
    options?: {
      type?: "TEXT" | "IMAGE";
      fileUrl?: string;
    },
  ) => void;
  onTyping: () => void;
  onStopTyping: () => void;
}

export function MessageInput({
  conversationId,
  onSend,
  onTyping,
  onStopTyping,
}: Props) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [interimText, setInterimText] = useState("");

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSentAtRef = useRef(0);

  const compose = useComposePreference(conversationId);

  const stt = useStreamingSTT({
    language: compose.sourceLang,
    onInterim: (t) => {
      setInterimText(t);
      onTyping();
    },
    onFinal: (t) => {
      setInterimText("");
      setText((prev) => {
        const trimmed = prev.trim();
        const next = trimmed ? `${trimmed} ${t}` : t;
        return next;
      });
      onTyping();
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) return;
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      });
    },
    onError: (err) => {
      setInterimText("");
      toast.error(err.message);
    },
  });

  const flushInterimToText = () => {
    if (!interimText.trim()) return;
    setText((prev) => {
      const trimmedPrev = prev.trim();
      return trimmedPrev ? `${trimmedPrev} ${interimText}` : interimText;
    });
    setInterimText("");
  };

  const statusText = STATUS_TEXT_VI[stt.status];
  const showStatusBar = !!statusText;

  const displayText =
    stt.isListening && interimText
      ? text
        ? `${text} ${interimText}`
        : interimText
      : text;

  const {
    suggestion,
    isLoading: isTranslating,
    error: translationError,
  } = useComposeTranslate({
    text,
    targetLang: compose.targetLang,
    enabled: compose.enabled,
    isComposing: isComposing || stt.isListening,
  });

  const applySuggestion = () => {
    if (!suggestion) return;
    setText(suggestion);
    onTyping();
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      el.setSelectionRange(end, end);
    });
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    // Check chặn 2 lần bấm cách nhau < 250ms
    const now = Date.now();
    if (now - lastSentAtRef.current < 250) {
      toast.error("Bạn gửi tin nhắn quá nhanh, vui lòng thử lại sau");
      return;
    }
    lastSentAtRef.current = now;

    if (stt.isListening) {
      stt.stop();
    }

    onSend(trimmed);
    setText("");
    setInterimText("");
    onStopTyping();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;

    if (
      e.key === "Tab" &&
      !e.shiftKey &&
      compose.enabled &&
      suggestion &&
      !isTranslating
    ) {
      e.preventDefault();
      applySuggestion();
      return;
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (stt.isListening) return;

    setText(e.target.value);
    onTyping();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSending(true);
      const imageUrl = await uploadSingleImage(file);
      onSend("", { type: "IMAGE", fileUrl: imageUrl });
    } finally {
      setIsSending(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleMic = () => {
    if (stt.isListening) {
      flushInterimToText();
      stt.stop();
    } else {
      void stt.start();
    }
  };

  return (
    <div className="border-t border-gray-200">
      {compose.enabled && (
        <ComposeTranslationPill
          suggestion={suggestion}
          isLoading={isTranslating}
          error={translationError}
          targetLang={compose.targetLang}
          onApply={applySuggestion}
        />
      )}

      <div className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="hover:text-blue-primary shrink-0 rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          <MicButton
            status={stt.status}
            isSupported={stt.isSupported}
            onClick={toggleMic}
          />

          <ComposeLanguagePopover
            enabled={compose.enabled}
            targetLang={compose.targetLang}
            sourceLang={compose.sourceLang}
            onToggle={compose.setEnabled}
            onChangeLang={compose.setTargetLang}
            onChangeSourceLang={compose.setSourceLang}
          />

          <div className="min-w-0 flex-1">
            <textarea
              ref={inputRef}
              value={displayText}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder={showStatusBar ? statusText : "Nhập tin nhắn..."}
              rows={1}
              readOnly={stt.isListening}
              className="focus:border-blue-primary focus:ring-blue-primary w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm outline-none focus:ring-1"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!text.trim() || isSending}
            className="bg-blue-primary hover:bg-blue-secondary shrink-0 rounded-full p-2.5 text-white transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
