import CreatePostBox from "@/pages/post/CreatePostBox";
import PostList from "@/pages/post/PostList";

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-170">
      <CreatePostBox />
      <PostList />
    </div>
  );
}
