import { useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useNotificationStore } from "@/shared/stores/notification.store";
import { useNotificationSocket } from "@/features/notification/hooks/useNotificationSocket";
import { cn } from "@/shared/lib/utils";
import NotificationDropdown from "./NotificationDropdown";

const NotificationBell = () => {
  useNotificationSocket();
  const { unreadCount } = useNotificationStore();
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
          aria-label="Thông báo"
        >
          <Bell className="size-5 text-gray-600" />

          {unreadCount > 0 && (
            <>
              <span className="absolute -top-1.5 -right-1.5 flex h-7 w-7 animate-ping rounded-full bg-red-400 opacity-75" />
              <Badge
                className={cn(
                  "absolute -top-1.5 -right-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-red-500 font-bold text-white tabular-nums shadow-sm",
                  unreadCount >= 10 ? "text-[10px]" : "text-[13px]",
                )}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-auto rounded-xl p-0 shadow-xl"
      >
        <NotificationDropdown onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
