"use client";

import Header from "@/shared/components/layout/Header";
import LeftSidebar from "@/shared/components/layout/LeftSidebar";
import RightSidebar from "@/shared/components/layout/RightSidebar";
import Loading from "@/shared/loading/Loading";
import { useAuthStore } from "@/shared/stores/auth.store";

export default function MainLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const isLoading = useAuthStore((s) => s.isLoading);
  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="mx-auto flex max-w-360">
        <LeftSidebar />
        <main className="min-w-0 flex-1 px-4 py-4">{children}</main>
        <RightSidebar />
      </div>
      {modal}
    </div>
  );
}
