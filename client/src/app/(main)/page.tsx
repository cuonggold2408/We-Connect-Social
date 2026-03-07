import CreatePostBox from "@/features/feed/ui/CreatePostBox";
import PostList from "@/features/feed/ui/PostList";

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-170">
      <CreatePostBox />
      <PostList />
    </div>
  );
}
