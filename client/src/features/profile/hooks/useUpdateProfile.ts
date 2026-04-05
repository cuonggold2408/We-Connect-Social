import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/shared/api/users.api";
import { profileKeys } from "@/features/profile/constants/profile.keys";
import { useAuthStore } from "@/shared/stores/auth.store";
import { toast } from "sonner";
import type {
  UpdateProfileData,
  UserProfile,
} from "@/features/profile/types/profile.types";

export function useUpdateProfile(username: string) {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);

  return useMutation({
    mutationFn: (data: UpdateProfileData) => userApi.updateProfile(data),

    onMutate: async (submittedData) => {
      await queryClient.cancelQueries({
        queryKey: profileKeys.detail(username),
      });

      const previous = queryClient.getQueryData<UserProfile>(
        profileKeys.detail(username),
      );

      queryClient.setQueryData<UserProfile>(
        profileKeys.detail(username),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            ...(submittedData.fullname !== undefined && {
              fullName: submittedData.fullname,
            }),
            ...(submittedData.bio !== undefined && { bio: submittedData.bio }),
            ...(submittedData.gender !== undefined && {
              gender: submittedData.gender,
            }),
            ...(submittedData.birthday !== undefined && {
              birthday: submittedData.birthday,
            }),
            ...(submittedData.address !== undefined && {
              address: submittedData.address,
            }),
          };
        },
      );

      if (user && submittedData.fullname !== undefined) {
        setUser({ ...user, fullName: submittedData.fullname });
      }

      return { previous };
    },

    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          profileKeys.detail(username),
          context.previous,
        );
      }
      toast.error("Cập nhật thất bại, vui lòng thử lại");
    },

    onSuccess: () => {
      toast.success("Cập nhật thông tin thành công");
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: profileKeys.detail(username),
      });
    },
  });
}
