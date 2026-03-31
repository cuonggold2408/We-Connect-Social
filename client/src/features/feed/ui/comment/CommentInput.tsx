"use client";

import { useRef, useState, useEffect } from "react";
import { Smile, Send, Loader2, X, Camera } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { useAuthStore } from "@/shared/stores/auth.store";
import { cn } from "@/shared/lib/utils";
import Image from "next/image";
import EmojiPicker, {
  EmojiClickData,
  EmojiStyle,
  Theme,
} from "emoji-picker-react";
import { uploadSingleImage } from "@/shared/helpers/upload-single-image";
import { toast } from "sonner";
import { ALLOWED_TYPES, MAX_FILE_SIZE } from "@/shared/helpers/constants";
import {
  CHAR_COUNT_THRESHOLD,
  MAX_COMMENT_LENGTH,
} from "@/features/feed/constants/comment";

interface CommentInputProps {
  onSubmit: (content: string, imageUrl?: string) => void;
  isPending: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  initialValue?: string;
}

export const CommentInput = ({
  onSubmit,
  isPending,
  placeholder = "Viết bình luận...",
  autoFocus = false,
  initialValue,
}: CommentInputProps) => {
  const [content, setContent] = useState(initialValue ?? "");
  const [showEmojis, setShowEmojis] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    if (initialValue && textareaRef.current) {
      const len = textareaRef.current.value.length;
      textareaRef.current.selectionStart = len;
      textareaRef.current.selectionEnd = len;
      textareaRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showEmojis) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target as Node)
      ) {
        setShowEmojis(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showEmojis]);

  const isBusy = isPending || isUploading;

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if ((!trimmed && !imageFile) || isBusy) return;

    let uploadedUrl: string | undefined;

    if (imageFile) {
      setIsUploading(true);
      try {
        uploadedUrl = await uploadSingleImage(imageFile);
      } catch {
        toast.error("Upload ảnh thất bại, vui lòng thử lại");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    onSubmit(trimmed, uploadedUrl);
    setContent("");
    setImagePreview(null);
    setImageFile(null);
    setShowEmojis(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newContent = content.slice(0, start) + emoji + content.slice(end);
      setContent(newContent);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
        textarea.focus();
      });
    } else {
      setContent((prev) => prev + emoji);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Chỉ hỗ trợ định dạng JPEG, PNG, GIF, WebP");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Dung lượng ảnh tối đa 10MB");
      return;
    }

    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    if (e.target) e.target.value = "";
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageFile(null);
  };

  const hasContent = content.trim().length > 0 || !!imagePreview;

  return (
    <div className="flex items-start gap-2">
      <Avatar className="size-8 shrink-0">
        <AvatarImage src={user?.avatarUrl || undefined} />
        <AvatarFallback className="bg-blue-primary text-xs font-bold text-white">
          {user?.fullName?.[0] || user?.username?.[0] || "U"}
        </AvatarFallback>
      </Avatar>

      <div className="relative min-w-0 flex-1">
        <div className="rounded-2xl bg-gray-100 px-3 pt-2 pb-1">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            rows={1}
            maxLength={MAX_COMMENT_LENGTH}
            className="max-h-30 w-full resize-none bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
          />

          {imagePreview && (
            <div className="relative my-1 inline-block">
              <div className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Loader2 className="h-5 w-5 animate-spin text-white" />
                  </div>
                )}
              </div>
              <button
                onClick={removeImage}
                disabled={isBusy}
                className="absolute -top-1.5 -right-1.5 rounded-full bg-gray-700 p-0.5 text-white hover:bg-gray-600 disabled:opacity-50"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}

          {content.length >= CHAR_COUNT_THRESHOLD && (
            <div className="flex justify-end px-1">
              <span
                className={cn(
                  "text-[11px] tabular-nums",
                  content.length >= MAX_COMMENT_LENGTH
                    ? "font-medium text-red-500"
                    : content.length >= MAX_COMMENT_LENGTH - 50
                      ? "text-amber-500"
                      : "text-gray-400",
                )}
              >
                {content.length}/{MAX_COMMENT_LENGTH}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5">
              <button
                ref={emojiButtonRef}
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                className={cn(
                  "cursor-pointer rounded-full p-1.5 transition-colors hover:bg-gray-200",
                  showEmojis && "bg-gray-200",
                )}
              >
                <Smile className="h-4 w-4 text-gray-500" />
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="cursor-pointer rounded-full p-1.5 transition-colors hover:bg-gray-200 disabled:opacity-50"
              >
                <Camera className="h-4 w-4 text-gray-500" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!hasContent || isBusy}
              className="cursor-pointer rounded-full p-1.5 text-blue-500 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-gray-300"
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {showEmojis && (
          <div
            ref={emojiPickerRef}
            className="absolute bottom-full left-0 z-50 mb-2 shadow-lg"
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme={Theme.AUTO}
              width={350}
              height={440}
              emojiStyle={EmojiStyle.FACEBOOK}
              searchPlaceHolder="Tìm emoji..."
              previewConfig={{ showPreview: false }}
              skinTonesDisabled
              lazyLoadEmojis
            />
          </div>
        )}
      </div>
    </div>
  );
};
