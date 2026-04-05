import PostDetail from "@/features/feed/ui/PostDetail";
import { createMetadata } from "@/shared/config/metadata";
import { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Chi tiết bài viết",
  description: "Xem chi tiết bài viết",
});

export default function PostDetailPage() {
  return (
    <div className="mx-auto max-w-170">
      <PostDetail />
    </div>
  );
}
