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

export const RegisterForm = () => {
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: RegisterValues) => {
    console.log("Form Data Submitted:", data);
    // TODO: Gọi API đăng ký
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
        >
          Đăng ký
        </Button>
      </form>

      <div className="mt-4 text-center">
        <p className="mb-4 text-sm text-gray-500">
          Bạn đã có tài khoản?{" "}
          <Link
            href="/login"
            className="font-medium text-[#1e5b98] hover:underline"
          >
            Đăng nhập
          </Link>
        </p>
      </div>
    </Form>
  );
};
