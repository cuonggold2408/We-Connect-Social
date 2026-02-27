"use client";

import {
  forgotPasswordSchema,
  ForgotPasswordValues,
} from "@/features/auth/forgot-password/model/forgot-password.schema";
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
import Link from "next/link";
import { useForm } from "react-hook-form";
import { ArrowLeft, CheckCircle } from "lucide-react";

const ForgotPasswordForm = () => {
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const forgotMutation = useMutation({
    mutationFn: (data: ForgotPasswordValues) =>
      authApi.forgotPassword(data.email),
  });

  const onSubmit = (data: ForgotPasswordValues) => {
    forgotMutation.mutate(data);
  };

  if (forgotMutation.isSuccess) {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-800">
          Kiểm tra email của bạn!
        </h3>
        <p className="text-sm text-gray-500">{forgotMutation.data.message}</p>
        <Link href="/login">
          <Button variant="outline" className="mt-4 w-full cursor-pointer">
            <ArrowLeft className="mr-2" /> Quay lại đăng nhập
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {forgotMutation.isError && (
          <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">
            {forgotMutation.error.message}
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

        <Button
          type="submit"
          className="bg-blue-primary hover:bg-blue-secondary w-full cursor-pointer"
          disabled={forgotMutation.isPending}
        >
          {forgotMutation.isPending
            ? "Đang gửi..."
            : "Gửi link đặt lại mật khẩu"}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Link
          href="/login"
          className="text-primary flex items-center justify-center hover:underline"
        >
          <ArrowLeft className="mr-2" />
          Quay lại đăng nhập
        </Link>
      </div>
    </Form>
  );
};

export default ForgotPasswordForm;
