"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/shared/stores/auth.store";
import {
  useProfile,
  ProfileHeader,
  ProfileInfo,
  ProfilePostList,
  EditProfileDialog,
  ProfileFriendPreview,
  ProfilePhotoGrid,
} from "@/features/profile";
import CreatePostBox from "@/features/feed/ui/CreatePostBox";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { data: profile, isLoading, isError } = useProfile(username);
  const currentUser = useAuthStore((s) => s.user);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="text-blue-primary h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (isError || !profile) {
    notFound();
  }

  const isOwner = currentUser?.id === profile.id;

  return (
    <div>
      <ProfileHeader profile={profile} onEditClick={() => setEditOpen(true)} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[450px_1fr]">
        <div className="space-y-4">
          <ProfileInfo profile={profile} />
          <ProfileFriendPreview
            userId={profile.id}
            friendCount={profile.friendCount}
          />
          <ProfilePhotoGrid userId={profile.id} />
        </div>

        <div>
          {isOwner && <CreatePostBox />}
          <ProfilePostList userId={profile.id} />
        </div>
      </div>

      {isOwner && (
        <EditProfileDialog
          profile={profile}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}
