import FriendsContent from "@/pages/friends/FriendsContent";
import { createMetadata } from "@/shared/config/metadata";
import { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Bạn bè",
  description: "Quản lý bạn bè và lời mời kết bạn",
});

export default function FriendsPage() {
  return (
    <div className="mx-auto max-w-200">
      <FriendsContent />
    </div>
  );
}
