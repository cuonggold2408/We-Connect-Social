"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useReactionList } from "@/features/feed/hooks/useReactionList";
import type { ReactionType } from "@/features/feed/types/post";
import { REACTION_CONFIG } from "@/features/feed/constants/config";
import { formatCount } from "@/shared/helpers/format-count";

interface ReactionStat {
  type: ReactionType;
  count: number;
}

interface ReactionListDialogProps {
  targetType: "post" | "comment";
  targetId: string;
  stats: ReactionStat[];
  totalCount: number;
  children: React.ReactNode;
}

export function ReactionListDialog({
  targetType,
  targetId,
  stats,
  totalCount,
  children,
}: ReactionListDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ReactionType | undefined>(
    undefined,
  );

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useReactionList(targetType, targetId, activeTab, open);

  const reactions = data?.pages.flatMap((page) => page.data) ?? [];

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) observerRef.current.disconnect();
      if (isFetchingNextPage || !node) return;

      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasNextPage) {
            fetchNextPage();
          }
        },
        {
          rootMargin: "0px 0px 300px 0px",
        },
      );

      observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage],
  );

  const tabs = [
    {
      key: undefined as ReactionType | undefined,
      label: "Tất cả",
      count: totalCount,
    },
    ...stats.map((stat) => ({
      key: stat.type as ReactionType | undefined,
      label: REACTION_CONFIG[stat.type].icon,
      count: stat.count,
    })),
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex max-w-md flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="min-w-0 border-b px-2 pt-3 pr-12">
          <DialogTitle className="sr-only">Danh sách cảm xúc</DialogTitle>
          <div
            role="tablist"
            className="flex min-w-0 gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key ?? "ALL"}
                role="tab"
                aria-selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "relative flex shrink-0 cursor-pointer items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  activeTab === tab.key
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                <span
                  className={cn(
                    tab.key !== undefined && "text-lg leading-none",
                  )}
                >
                  {tab.label}
                </span>
                {tab.key !== undefined && (
                  <span className="text-sm tabular-nums">
                    {formatCount(tab.count)}
                  </span>
                )}
                {activeTab === tab.key && (
                  <span className="absolute right-0 bottom-0 left-0 h-0.5 rounded-full bg-blue-600" />
                )}
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* Reaction list */}
        <ScrollArea className="h-90 min-w-0">
          <div className="space-y-1 px-4 pb-4">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex animate-pulse items-center gap-3 rounded-lg p-2"
                  >
                    <div className="h-10 w-10 rounded-full bg-gray-200" />
                    <div className="h-4 w-32 rounded bg-gray-200" />
                  </div>
                ))
              : reactions.map((reaction) => (
                  <div
                    key={reaction.id}
                    className="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
                  >
                    <div className="relative">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={reaction.user.avatarUrl ?? ""}
                          alt={reaction.user.fullname ?? reaction.user.username}
                        />
                        <AvatarFallback className="bg-blue-primary text-sm font-bold text-white">
                          {reaction.user.fullname?.[0] ??
                            reaction.user.username[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="absolute -right-0.5 -bottom-0.5 text-sm leading-none">
                        {REACTION_CONFIG[reaction.type].icon}
                      </span>
                    </div>
                    <span className="truncate text-sm font-medium">
                      {reaction.user.fullname ?? reaction.user.username}
                    </span>
                  </div>
                ))}

            <div ref={loadMoreRef} className="h-1" />

            {isFetchingNextPage && (
              <div className="flex justify-center py-3">
                <Loader2 className="text-blue-primary h-5 w-5 animate-spin" />
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
