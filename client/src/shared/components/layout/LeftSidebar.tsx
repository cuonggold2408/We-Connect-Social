"use client";

import { MessageCircle, Users, Settings, Globe, House } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/shared/lib/utils";
import GroupIcon from "@/shared/components/ui/group-icon";

const navItems = [
  { href: "/", label: "Trang chủ", icon: House },
  { href: "/messenger", label: "Tin nhắn", icon: MessageCircle },
  { href: "/friends", label: "Bạn bè", icon: Users },
  { href: "/groups", label: "Nhóm", icon: GroupIcon },
];

const settingsItems = [
  { href: "/settings/account", label: "Tài khoản", icon: Settings },
  { href: "/settings/languages", label: "Ngôn ngữ", icon: Globe },
];

const LeftSidebar = () => {
  const pathname = usePathname();

  const renderNavItem = (item: (typeof navItems)[0]) => (
    <Link
      key={item.href}
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
        pathname === item.href
          ? "text-blue-primary bg-blue-50"
          : "text-gray-700 hover:bg-gray-100",
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </Link>
  );

  return (
    <aside className="sticky top-14 hidden h-[calc(100vh-56px)] w-72 overflow-y-auto px-2 py-4 lg:block">
      <nav className="space-y-1">{navItems.map(renderNavItem)}</nav>
      <div className="my-4 border-t border-gray-200" />
      <p className="mb-2 px-4 text-xs font-semibold text-gray-400 uppercase">
        Cài đặt
      </p>
      <nav className="space-y-1">{settingsItems.map(renderNavItem)}</nav>
    </aside>
  );
};

export default LeftSidebar;
