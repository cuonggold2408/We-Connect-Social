"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/stores/auth.store";
import { authApi } from "@/shared/api/auth.api";
import { useRouter } from "next/navigation";

export default function Page() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const consumeToast = useAuthStore((s) => s.consumeToast);
  const router = useRouter();
  const clearUser = useAuthStore((s) => s.clearUser);

  const handleLogout = async () => {
    await authApi.logout();
    clearUser();
    router.push("/login");
  };
  useEffect(() => {
    const pending = consumeToast();
    if (pending) {
      toast[pending.type](pending.message, {
        description: pending.description,
        position: pending.position,
      });
    }
  }, [consumeToast]);

  if (isLoading) {
    return <p>Đang tải...</p>;
  }

  return (
    <>
      <h1>Thông tin user</h1>
      <p>{user?.username}</p>
      <p>{user?.email}</p>
      <button onClick={handleLogout}>Đăng xuất</button>
    </>
  );
}
