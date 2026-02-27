"use client";

import {
  resetPasswordSchema,
  ResetPasswordValues,
} from "@/features/auth/reset-password/model/reset-password.schema";
import { authApi } from "@/shared/api/auth.api";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { ApiError } from "@/shared/api/axios";

const ResetPasswordForm = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token");

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const resetMutation = useMutation({
    mutationFn: (data: ResetPasswordValues) =>
      authApi.resetPassword({
        token: token!,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      }),
    onSuccess: () => {
      setTimeout(() => router.push("/login"), 5000);
    },
  });

  const onSubmit = (data: ResetPasswordValues) => {
    resetMutation.mutate(data);
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="text-lg font-semibold text-red-500">
          Link không hợp lệ
        </h3>
        <p className="text-sm text-gray-500">
          Không tìm thấy token đặt lại mật khẩu trong đường dẫn. Vui lòng sử
          dụng link được gửi đến email của bạn.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/forgot-password">
            <Button className="bg-blue-primary hover:bg-blue-secondary mt-2 w-full cursor-pointer">
              Yêu cầu link mới
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full cursor-pointer">
              <ArrowLeft className="mr-2" /> Quay lại đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (resetMutation.isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-800">
          Đặt lại mật khẩu thành công! 🎉
        </h3>
        <p className="text-sm text-gray-500">{resetMutation.data.message}</p>
        <p className="text-xs text-gray-400">
          Tự động chuyển đến trang đăng nhập trong giây lát...
        </p>
        <Link href="/login">
          <Button className="bg-blue-primary hover:bg-blue-secondary mt-2 w-full cursor-pointer">
            Đăng nhập ngay
          </Button>
        </Link>
      </div>
    );
  }

  const isTokenError =
    resetMutation.isError &&
    resetMutation.error instanceof ApiError &&
    (resetMutation.error.statusCode === 400 ||
      resetMutation.error.statusCode === 401);

  if (isTokenError) {
    return (
      <div className="space-y-4 text-center">
        <XCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="text-lg font-semibold text-red-500">
          {resetMutation.error.message}
        </h3>
        <p className="text-sm text-gray-500">
          Token đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng yêu cầu
          link mới.
        </p>
        <div className="flex flex-col gap-2">
          <Link href="/forgot-password">
            <Button className="bg-blue-primary hover:bg-blue-secondary mt-2 w-full cursor-pointer">
              Yêu cầu link mới
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full cursor-pointer">
              <ArrowLeft className="mr-2" /> Quay lại đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {resetMutation.isError && (
          <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
            {resetMutation.error.message}
          </div>
        )}

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu mới</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nhập mật khẩu mới..."
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Xác nhận mật khẩu</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nhập lại mật khẩu..."
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="bg-blue-primary hover:bg-blue-secondary w-full cursor-pointer"
          disabled={resetMutation.isPending}
        >
          {resetMutation.isPending ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link href="/login" className="text-sm text-blue-500 hover:underline">
          <ArrowLeft className="mr-2" /> Quay lại đăng nhập
        </Link>
      </div>
    </Form>
  );
};

export default ResetPasswordForm;
