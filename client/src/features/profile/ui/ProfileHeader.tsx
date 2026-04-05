"use client";

import { useRef } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Button } from "@/shared/components/ui/button";
import { FriendRequestButton } from "@/features/friends";
import { useProfileUpload } from "@/features/profile/hooks/useProfileUpload";
import type { UserProfile } from "@/features/profile/types/profile.types";
import { ALLOWED_TYPES, MAX_FILE_SIZE } from "@/shared/helpers/constants";
import { toast } from "sonner";

interface ProfileHeaderProps {
  profile: UserProfile;
  onEditClick: () => void;
}

export function ProfileHeader({ profile, onEditClick }: ProfileHeaderProps) {
  const isOwner = profile.relationshipStatus === "SELF";
  const { upload, isUploading } = useProfileUpload(profile.username);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "avatar" | "cover",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Chỉ hỗ trợ định dạng JPEG, PNG, GIF, WebP");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("Dung lượng ảnh tối đa 10MB");
      return;
    }

    upload(file, target);
  };

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
      <div className="relative h-52 bg-linear-to-r from-blue-400 to-blue-600 sm:h-72 md:h-80">
        {profile.coverUrl && (
          <Image
            src={profile.coverUrl}
            alt="Ảnh bìa"
            fill
            className="object-cover"
            priority
          />
        )}

        {isOwner && (
          <>
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-4 bottom-4 cursor-pointer gap-2 bg-white/90 hover:bg-white"
              onClick={() => coverInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              Chỉnh sửa ảnh bìa
            </Button>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              onChange={(e) => handleFileSelect(e, "cover")}
            />
          </>
        )}
      </div>

      <div className="relative px-4 pb-4 sm:px-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end">
          <div className="relative -mt-16 sm:-mt-20">
            <Avatar className="size-32 border-4 border-white shadow-md sm:size-36">
              <AvatarImage
                src={profile.avatarUrl || undefined}
                alt={profile.fullName || profile.username}
              />
              <AvatarFallback className="bg-blue-primary text-3xl font-bold text-white">
                {profile.fullName?.[0] || profile.username[0]}
              </AvatarFallback>
            </Avatar>

            {isOwner && (
              <>
                <button
                  className="absolute right-1 bottom-1 flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 shadow-sm transition-colors hover:bg-gray-300"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Camera className="h-4 w-4 text-gray-700" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e, "avatar")}
                />
              </>
            )}
          </div>

          <div className="flex-1 text-center sm:pb-2 sm:text-left">
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.fullName || profile.username}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {profile.friendCount} bạn bè
              {profile.mutualFriendCount > 0 &&
                profile.relationshipStatus !== "SELF" && (
                  <span> · {profile.mutualFriendCount} bạn chung</span>
                )}
            </p>
          </div>

          <div className="pb-2">
            {isOwner ? (
              <Button
                className="cursor-pointer"
                variant="outline"
                onClick={onEditClick}
              >
                Chỉnh sửa trang cá nhân
              </Button>
            ) : (
              <FriendRequestButton userId={profile.id} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
