import { useQuery } from "@tanstack/react-query";
import { friendshipsApi } from "@/shared/api/friendships.api";
import { profileKeys } from "@/features/profile/constants/profile.keys";

export function useProfileFriends(userId: string) {
  return useQuery({
    queryKey: profileKeys.friends(userId),
    queryFn: () => friendshipsApi.getUserFriends(userId, 9),
    enabled: !!userId,
    staleTime: 1000 * 60,
  });
}
