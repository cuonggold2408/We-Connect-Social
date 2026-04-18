import Link from "next/link";
import { Metadata } from "next";
import { Users, House, Sparkles, MessageCircle, Calendar } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { createMetadata } from "@/shared/config/metadata";

export const metadata: Metadata = createMetadata({
  title: "Nhóm",
  description: "Tính năng nhóm sẽ sớm ra mắt trên We-Connect",
});

export default function GroupsPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-200 items-center justify-center px-4 py-10">
      <div className="flex w-full flex-col items-center text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 animate-pulse rounded-full bg-blue-100 blur-2xl" />
          <div className="bg-blue-primary relative flex h-24 w-24 items-center justify-center rounded-full shadow-lg">
            <Users className="h-12 w-12 text-white" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 shadow-md">
            <Sparkles className="h-4 w-4 text-white" />
          </span>
        </div>

        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
            <span className="bg-blue-primary relative inline-flex h-2 w-2 rounded-full" />
          </span>
          <span className="text-blue-primary text-sm font-medium">
            Đang phát triển
          </span>
        </div>

        <p className="mb-8 max-w-md text-base text-gray-600 md:text-lg">
          Hãy quay lại sau nhé!
        </p>

        <div className="mb-10 grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { label: "Tạo nhóm", icon: Users },
            { label: "Thảo luận", icon: MessageCircle },
            { label: "Sự kiện", icon: Calendar },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-1 flex items-center justify-center">
                <item.icon className="text-blue-primary size-5" />
              </div>
              <div className="text-sm font-medium text-gray-700">
                {item.label}
              </div>
            </div>
          ))}
        </div>

        <Button
          asChild
          className="bg-blue-primary hover:bg-blue-primary/90 h-12 rounded-full px-8 text-base font-semibold text-white shadow-md transition-all hover:shadow-lg"
        >
          <Link href="/">
            <House className="mr-2 h-5 w-5" />
            Về trang chủ
          </Link>
        </Button>
      </div>
    </div>
  );
}
