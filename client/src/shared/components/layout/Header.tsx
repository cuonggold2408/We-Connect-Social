"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  MessageCircle,
  Users,
  X,
  House,
  User,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/shared/stores/auth.store";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import GroupIcon from "@/shared/components/ui/group-icon";
import { Button } from "@/shared/components/ui/button";
import MenuGridIcon from "@/shared/components/ui/menugrid-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { authApi } from "@/shared/api/auth.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import NotificationBell from "@/features/notification/ui/NotificationBell";

const NAV_ITEMS = [
  { href: "/", label: "Trang chủ", icon: House },
  { href: "/messenger", label: "Tin nhắn", icon: MessageCircle },
  { href: "/friends", label: "Bạn bè", icon: Users },
  { href: "/groups", label: "Nhóm", icon: GroupIcon },
] as const;

const Header = () => {
  const user = useAuthStore((s) => s.user);
  const pathname = usePathname();
  const router = useRouter();
  const clearUser = useAuthStore((s) => s.clearUser);
  const queryClient = useQueryClient();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeSearch = useCallback(() => setIsSearchOpen(false), []);

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear();
      clearUser();
      router.push("/login");
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  useEffect(() => {
    if (isSearchOpen) inputRef.current?.focus();
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSearchOpen, closeSearch]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isSearchOpen, closeSearch]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-360 items-center px-4">
        {/* Left: Logo + Search */}
        <div className="flex flex-1 items-center gap-3">
          <Link href="/" className="text-blue-primary text-2xl font-bold">
            <Image
              src="/weconnect-logo.png"
              alt="logo"
              width={40}
              height={40}
            />
          </Link>

          <div className="hidden h-10 w-65 items-center rounded-full bg-gray-100 px-4 py-2 lg:flex">
            <Search className="mr-2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm trên We-Connect"
              className="w-full border-none bg-transparent text-sm outline-none focus:border-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          <div className="relative lg:hidden" ref={searchRef}>
            <Button
              onClick={() => setIsSearchOpen((prev) => !prev)}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200"
              aria-label="Tìm kiếm"
            >
              {isSearchOpen ? (
                <X className="h-5 w-5 text-gray-600" />
              ) : (
                <Search className="h-5 w-5 text-gray-600" />
              )}
            </Button>

            {isSearchOpen && (
              <div className="absolute top-12 left-0 z-50 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
                <div className="flex items-center rounded-full bg-gray-100 px-4 py-2">
                  <Search className="mr-2 h-4 w-4 text-gray-400" />
                  <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Tìm kiếm trên We-Connect"
                    className="w-full border-none bg-transparent text-sm outline-none focus:border-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Center: Navigation Icons */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex h-12 w-24 items-center justify-center rounded-lg transition-colors",
                pathname === href
                  ? "text-blue-primary"
                  : "text-gray-500 hover:bg-gray-100",
              )}
              title={label}
            >
              <Icon className="h-6 w-6" />
              {pathname === href && (
                <span className="bg-blue-primary absolute right-2 bottom-0 left-2 h-0.5 rounded-full" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right: Avatar + Menu + Notification */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <Button className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200">
            <MenuGridIcon className="size-5 text-gray-600" />
          </Button>
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar className="size-10 cursor-pointer">
                <AvatarImage
                  src={user?.avatarUrl || undefined}
                  alt={user?.fullName || "User Avatar"}
                />
                <AvatarFallback className="bg-blue-primary flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-sm font-bold text-white">
                  {user?.fullName?.[0] || user?.username?.[0]}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mt-2 w-38">
              <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer p-2">
                <User className="h-4 w-4" /> Trang cá nhân
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer p-2">
                <Settings className="h-4 w-4" /> Cài đặt
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                className="cursor-pointer p-2"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                {logoutMutation.isPending ? "Đang đăng xuất..." : "Đăng xuất"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
