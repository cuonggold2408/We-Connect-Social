"use client";

import { useState, useRef } from "react";
import { Send, Image as ImageIcon } from "lucide-react";
import { uploadSingleImage } from "@/shared/helpers/upload-single-image";
import { toast } from "sonner";
import { ComposeTranslationPill } from "@/features/translation/ui/ComposeTranslationPill";
import { useComposePreference } from "@/features/translation/hooks/useComposePreference";
import { useComposeTranslate } from "@/features/translation/hooks/useComposeTranslate";
import { ComposeLanguagePopover } from "@/features/translation/ui/ComposeLanguagePopover";

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

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSentAtRef = useRef(0);

  const compose = useComposePreference(conversationId);

  const {
    suggestion,
    isLoading: isTranslating,
    error: translationError,
  } = useComposeTranslate({
    text,
    targetLang: compose.targetLang,
    enabled: compose.enabled,
    isComposing,
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

    onSend(trimmed);
    setText("");
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

          <ComposeLanguagePopover
            enabled={compose.enabled}
            targetLang={compose.targetLang}
            onToggle={compose.setEnabled}
            onChangeLang={compose.setTargetLang}
          />

          <div className="min-w-0 flex-1">
            <textarea
              ref={inputRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              placeholder="Nhập tin nhắn..."
              rows={1}
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
