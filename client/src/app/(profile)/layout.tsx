"use client";

import Header from "@/shared/components/layout/Header";
import Loading from "@/shared/loading/Loading";
import { useAuthStore } from "@/shared/stores/auth.store";
import { useFriendshipSocket } from "@/features/friends";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoading = useAuthStore((s) => s.isLoading);
  useFriendshipSocket();

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-4">{children}</main>
    </div>
  );
}
