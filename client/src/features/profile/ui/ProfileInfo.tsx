"use client";

import { MapPin, Calendar, Clock, User } from "lucide-react";
import type { UserProfile } from "@/features/profile/types/profile.types";

interface ProfileInfoProps {
  profile: UserProfile;
}

const GENDER_LABEL: Record<string, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

export function ProfileInfo({ profile }: ProfileInfoProps) {
  const joinDate = new Date(profile.createdAt).toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  const items = [
    profile.bio && {
      icon: null,
      text: profile.bio,
      isBio: true,
    },
    profile.address && {
      icon: MapPin,
      text: `Sống tại ${profile.address}`,
    },
    profile.birthday && {
      icon: Calendar,
      text: (() => {
        const d = new Date(profile.birthday!);
        return `Sinh ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
      })(),
    },
    profile.gender && {
      icon: User,
      text: GENDER_LABEL[profile.gender] || profile.gender,
    },
    {
      icon: Clock,
      text: `Tham gia từ ${joinDate}`,
    },
  ].filter(Boolean) as Array<{
    icon: typeof MapPin | null;
    text: string;
    isBio?: boolean;
  }>;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 text-lg font-semibold text-gray-900">Giới thiệu</h3>

      <div className="space-y-3">
        {items.map((item, i) =>
          item.isBio ? (
            <p key={i} className="text-center text-sm text-gray-700">
              {item.text}
            </p>
          ) : (
            <div
              key={i}
              className="flex items-center gap-2.5 text-sm text-gray-600"
            >
              {item.icon && <item.icon className="h-4 w-4 text-gray-400" />}
              <span>{item.text}</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
