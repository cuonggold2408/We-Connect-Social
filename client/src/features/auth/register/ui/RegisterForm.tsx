"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterValues, registerSchema } from "../model/register.schema";
import { Button } from "@/shared/components/ui/button"; // Import từ shadcn
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form"; // Import từ shadcn
import { Input } from "@/shared/components/ui/input"; // Import từ shadcn
import { PasswordChecklist } from "./PasswordChecklist";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { authApi } from "@/shared/api/auth.api";

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm = ({ onSuccess }: RegisterFormProps) => {
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => onSuccess?.(),
  });

  const onSubmit = (data: RegisterValues) => {
    registerMutation.mutate(data);
  };

  if (registerMutation.isSuccess) {
    return (
      <div className="rounded-lg bg-green-50 p-6 text-center">
        <p className="text-lg font-semibold text-green-700">
          Đăng ký thành công! 🎉
        </p>
        <p className="mt-2 text-sm text-green-600">
          {registerMutation.data.message}
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {registerMutation.isError && (
          <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
            {registerMutation.error.message}
          </div>
        )}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên</FormLabel>
              <FormControl>
                <Input placeholder="john.doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="john.doe@gmail.com"
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
              <PasswordChecklist password={field.value || ""} />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="bg-blue-primary hover:bg-blue-secondary w-full cursor-pointer"
          disabled={registerMutation.isPending}
        >
          {registerMutation.isPending ? "Đang xử lý..." : "Đăng ký"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <p className="mb-4 text-sm text-gray-500">
          Bạn đã có tài khoản?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </Form>
  );
};
