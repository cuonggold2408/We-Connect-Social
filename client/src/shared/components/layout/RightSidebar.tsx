"use client";

import { UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import {
  useReceivedRequests,
  usePendingReceivedCount,
  FriendRequestCard,
} from "@/features/friends";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/utils";

const RightSidebar = () => {
  const { data: pendingCount } = usePendingReceivedCount();
  const { data, isLoading } = useReceivedRequests();

  const requests =
    data?.pages.flatMap((page) => page?.data ?? []).slice(0, 3) ?? [];

  return (
    <aside
      className={cn(
        "sticky top-14 hidden h-max w-75 overflow-y-auto px-4 py-4 xl:block",
        pendingCount && pendingCount > 0 && "rounded-b-lg bg-white shadow-lg",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-500">
            Lời mời kết bạn
          </h3>
          {(pendingCount ?? 0) > 0 && (
            <Badge
              variant="destructive"
              className="h-5 min-w-5 rounded-full px-1.5 text-xs"
            >
              {pendingCount}
            </Badge>
          )}
        </div>
        <Link
          href="/friends"
          className="text-blue-primary text-xs font-medium hover:underline"
        >
          Xem tất cả
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <UserPlus className="h-8 w-8 text-gray-300" />
          <p className="mt-2 text-xs text-gray-400">Không có lời mời nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <FriendRequestCard key={req.id} request={req} variant="compact" />
          ))}
        </div>
      )}
    </aside>
  );
};

export default RightSidebar;
