"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { friendshipsApi } from "@/shared/api/friendships.api";
import { friendshipKeys } from "@/features/friends/constants/friendship.keys";
import type { Friend } from "@/features/friends/types/friendship.types";

const DEBOUNCE_MS = 250;

export function useDebouncedValue<T>(value: T, delay = DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useFriendSearch(query: string) {
  const debouncedQuery = useDebouncedValue(query.trim().toLowerCase());
  const enabled = debouncedQuery.length > 0;

  const { data, isLoading } = useQuery({
    queryKey: [...friendshipKeys.friends(), "search-pool"],
    queryFn: () => friendshipsApi.getFriends(undefined, 200),
    staleTime: 60_000,
    enabled,
  });

  const friends: Friend[] = data?.data ?? [];

  const matched = useMemo(() => {
    if (!enabled) return [];
    return friends.filter((f) => {
      const name = (f.friend.fullname ?? "").toLowerCase();
      const username = f.friend.username.toLowerCase();
      return name.includes(debouncedQuery) || username.includes(debouncedQuery);
    });
  }, [friends, debouncedQuery, enabled]);

  return {
    query: debouncedQuery,
    matches: matched,
    isLoading: enabled && isLoading,
  };
}
