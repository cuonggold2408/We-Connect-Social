"use client";

import {
  loginSchema,
  LoginValues,
} from "@/features/auth/login/model/login.schema";
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
import { useAuthStore } from "@/shared/stores/auth.store";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

const LoginForm = () => {
  const router = useRouter();
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      if (data.data?.user) {
        useAuthStore.getState().setUser(data.data.user);
      }

      useAuthStore.getState().setPendingToast({
        message: data.message,
        type: "success",
        description: "Chào mừng bạn đến với mạng xã hội We-Connect",
      });

      router.push("/");
    },
  });

  const onSubmit = (data: LoginValues) => {
    loginMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {loginMutation.isError && (
          <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
            {loginMutation.error.message}
          </div>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="example@gmail.com"
                  type="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nhập mật khẩu..."
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-primary text-sm font-medium hover:underline"
          >
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          type="submit"
          className="bg-blue-primary hover:bg-blue-secondary w-full cursor-pointer"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Đang xử lý..." : "Đăng nhập"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <p className="mb-4 text-sm text-gray-500">
          Bạn chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="text-primary font-medium hover:underline"
          >
            Đăng ký
          </Link>
        </p>
      </div>
    </Form>
  );
};

export default LoginForm;
