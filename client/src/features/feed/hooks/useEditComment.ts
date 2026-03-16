import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { uploadSingleImage } from "@/shared/helpers/upload-single-image";
import { useUpdateComment } from "@/features/feed/hooks/useComments";
import { ALLOWED_TYPES, MAX_FILE_SIZE } from "@/shared/helpers/constants";
import type { Comment } from "@/features/feed/types/post";

export function useEditComment(postId: string, comment: Comment) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [editImageUrl, setEditImageUrl] = useState<string | null>(
    comment.imageUrl || null,
  );
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateComment = useUpdateComment(postId);

  useEffect(() => {
    return () => {
      if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    };
  }, [editImagePreview]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      const el = textareaRef.current;
      const len = el.value.length;
      el.selectionStart = len;
      el.selectionEnd = len;
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }, [isEditing]);

  const startEditing = useCallback(() => setIsEditing(true), []);

  const resetEditState = useCallback(() => {
    setIsEditing(false);
    setEditContent(comment.content);
    setEditImageUrl(comment.imageUrl || null);
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImagePreview(null);
    setEditImageFile(null);
  }, [comment.content, comment.imageUrl, editImagePreview]);

  const handleEditSubmit = useCallback(async () => {
    const trimmed = editContent.trim();
    const hasImageChanged =
      editImageUrl !== (comment.imageUrl || null) || editImageFile !== null;

    if (!trimmed && !editImagePreview && !editImageUrl) return;

    if (trimmed === comment.content && !hasImageChanged) {
      setIsEditing(false);
      return;
    }

    let uploadedUrl = editImageUrl;

    if (editImageFile) {
      setIsUploading(true);
      try {
        uploadedUrl = await uploadSingleImage(editImageFile);
      } catch {
        toast.error("Upload ảnh thất bại, vui lòng thử lại");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    updateComment.mutate(
      { commentId: comment.id, content: trimmed, imageUrl: uploadedUrl },
      { onSuccess: () => setIsEditing(false) },
    );
  }, [
    editContent,
    editImageUrl,
    editImageFile,
    editImagePreview,
    comment,
    updateComment,
  ]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.nativeEvent.isComposing) return;
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleEditSubmit();
      }
      if (e.key === "Escape") {
        resetEditState();
      }
    },
    [handleEditSubmit, resetEditState],
  );

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
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

      if (editImagePreview) URL.revokeObjectURL(editImagePreview);
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
      setEditImageUrl(null);
      if (e.target) e.target.value = "";
    },
    [editImagePreview],
  );

  const removeImage = useCallback(() => {
    if (editImagePreview) URL.revokeObjectURL(editImagePreview);
    setEditImagePreview(null);
    setEditImageFile(null);
    setEditImageUrl(null);
  }, [editImagePreview]);

  return {
    isEditing,
    editContent,
    setEditContent,
    editImageUrl,
    editImagePreview,
    isUploading,
    textareaRef,
    fileInputRef,
    startEditing,
    resetEditState,
    handleEditSubmit,
    handleEditKeyDown,
    handleImageSelect,
    removeImage,
  };
}
