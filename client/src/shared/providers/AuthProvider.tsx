"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/shared/stores/auth.store";
import { userApi } from "@/shared/api/users.api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const clearUser = useAuthStore((s) => s.clearUser);
  const setLoading = useAuthStore((s) => s.setLoading);

  useEffect(() => {
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
  }, [setUser, clearUser, setLoading]);

  return <>{children}</>;
}
