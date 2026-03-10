"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/shared/stores/auth.store";
import { userApi } from "@/shared/api/users.api";
import { AUTH_ROUTES } from "@/proxy";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const pathname = usePathname();

  useEffect(() => {
    const isAuthRoute = AUTH_ROUTES.some((route) =>
      (pathname ?? "").startsWith(route),
    );

    if (isAuthRoute) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const initAuth = async () => {
      try {
        const response = await userApi.getMe();
        if (response.data) {
          setUser(response.data);
        } else {
          clearUser();
        }
      } catch {
        clearUser();
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [setUser, clearUser, setLoading, pathname]);

  return <>{children}</>;
}
