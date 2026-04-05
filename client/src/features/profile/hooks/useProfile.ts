import { useQuery } from "@tanstack/react-query";
import { userApi } from "@/shared/api/users.api";
import { profileKeys } from "@/features/profile/constants/profile.keys";
export function useProfile(username: string) {
  return useQuery({
    queryKey: profileKeys.detail(username),
    queryFn: () => userApi.getProfile(username),
    enabled: !!username,
    staleTime: 1000 * 30,
  });
}
