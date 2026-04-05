"use client";

import Link from "next/link";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { useProfileFriends } from "@/features/profile/hooks/useProfileFriends";

interface ProfileFriendPreviewProps {
  userId: string;
  friendCount: number;
}

export function ProfileFriendPreview({
  userId,
  friendCount,
}: ProfileFriendPreviewProps) {
  const { data } = useProfileFriends(userId);
  const friends = data?.data ?? [];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bạn bè</h3>
          <p className="text-sm text-gray-500">{friendCount} bạn bè</p>
        </div>
      </div>

      {friends.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {friends.map((item) => (
            <Link
              key={item.id}
              href={`/${item.friend.username}`}
              className="group"
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                <Avatar className="h-full w-full rounded-lg">
                  <AvatarImage
                    src={item.friend.avatarUrl ?? undefined}
                    alt={item.friend.fullname ?? item.friend.username}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-blue-primary rounded-lg text-xl font-bold text-white">
                    {(item.friend.fullname ?? item.friend.username)
                      .charAt(0)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <p className="mt-1 truncate text-xs font-medium text-gray-700 group-hover:underline">
                {item.friend.fullname ?? item.friend.username}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-gray-400">
          Chưa có bạn bè nào
        </p>
      )}
    </div>
  );
}
