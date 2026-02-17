"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/shared/stores/auth.store";

export default function Page() {
  const consumeToast = useAuthStore((s) => s.consumeToast);

  useEffect(() => {
    const pending = consumeToast();
    if (pending) {
      toast[pending.type](pending.message, {
        description: pending.description,
        position: pending.position,
      });
    }
  }, [consumeToast]);

  return "Hello";
}
