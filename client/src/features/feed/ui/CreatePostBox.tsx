"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postsApi } from "@/shared/api/posts.api";
import { useAuthStore } from "@/shared/stores/auth.store";
import { Textarea } from "@/shared/components/ui/textarea";
import { Button } from "@/shared/components/ui/button";
import { Globe, ImagePlus, Lock, Users } from "lucide-react";
import { toast } from "sonner";
import { PostVisibility } from "@/features/feed/types/post";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const VISIBILITY_OPTIONS: {
  value: PostVisibility;
  label: string;
  icon: typeof Globe;
}[] = [
  { value: "PUBLIC", label: "Công khai", icon: Globe },
  { value: "FRIENDS", label: "Bạn bè", icon: Users },
  { value: "PRIVATE", label: "Chỉ mình tôi", icon: Lock },
];

const CreatePostBox = () => {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [visibility, setVisibility] = useState<PostVisibility>("PUBLIC");

  const createMutation = useMutation({
    mutationFn: postsApi.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const handleSubmit = () => {
    if (!content.trim()) return;

    const trimmedContent = content.trim();
    setContent("");
    setIsExpanded(false);
    setVisibility("PUBLIC");

    toast.promise(
      createMutation.mutateAsync({ content: trimmedContent, visibility }),
      {
        loading: "Đang đăng bài...",
        success: "Đã đăng bài viết thành công!",
        error: "Không thể đăng bài, vui lòng thử lại.",
      },
    );
  };

  console.log("visibility: ", visibility);

  return (
    <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="bg-blue-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
          {user?.fullName?.[0] || user?.username?.[0] || ""}
        </div>

        <div className="flex-1">
          {isExpanded ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`${user?.username} ơi, bạn đang nghĩ gì thế?`}
              className="min-h-25 resize-none border-0 px-0 pt-2 text-sm focus-visible:ring-0"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsExpanded(true)}
              className="w-full rounded-full bg-gray-100 px-4 py-2.5 text-left text-sm text-gray-500 transition-colors hover:bg-gray-200"
            >
              {`${user?.username} ơi, bạn đang nghĩ gì thế?`}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
          <div className="flex items-center gap-2">
            <button className="flex cursor-pointer items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
              <ImagePlus className="text-blue-primary size-6" />
              <span className="text-md">Ảnh</span>
            </button>

            <Select
              value={visibility}
              onValueChange={(value) => setVisibility(value as PostVisibility)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem
                      className="cursor-pointer"
                      key={option.value}
                      value={option.value}
                    >
                      <option.icon className="h-3.5 w-3.5" />
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setIsExpanded(false);
                setContent("");
              }}
              className="cursor-pointer p-4"
            >
              Huỷ
            </Button>
            <Button
              className="bg-blue-primary hover:bg-blue-secondary cursor-pointer p-4 text-white"
              onClick={handleSubmit}
              disabled={!content.trim()}
            >
              Đăng
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostBox;
