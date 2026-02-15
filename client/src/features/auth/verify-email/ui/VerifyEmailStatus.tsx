"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2, MailOpen } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { authApi } from "@/shared/api/auth.api";
import Link from "next/link";
import ResendVerificationForm from "@/features/auth/verify-email/ui/ResendVerificationForm";
import { ApiError } from "@/shared/api/axios";

export const VerifyEmailStatus = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get("token");

  const verifyMutation = useMutation({
    mutationFn: (token: string) => authApi.verifyEmail(token),
    onSuccess: () => {
      setTimeout(() => router.push("/login"), 5000);
    },
  });

  useEffect(() => {
    if (
      token &&
      !verifyMutation.isPending &&
      !verifyMutation.isSuccess &&
      !verifyMutation.isError
    ) {
      verifyMutation.mutate(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token) {
    return (
      <StatusCard
        icon={<XCircle className="h-12 w-12 text-red-500" />}
        title="Link không hợp lệ"
        message="Không tìm thấy token xác thực trong đường dẫn."
      />
    );
  }

  if (verifyMutation.isPending) {
    return (
      <StatusCard
        icon={<Loader2 className="h-12 w-12 animate-spin text-blue-500" />}
        title="Đang xác thực..."
        message="Vui lòng đợi trong giây lát."
      />
    );
  }

  if (verifyMutation.isSuccess) {
    return (
      <StatusCard
        icon={<CheckCircle className="h-12 w-12 text-green-500" />}
        title="Xác thực thành công! 🎉"
        message={verifyMutation.data.message}
      >
        <p className="mt-1 text-xs text-gray-400">
          Tự động chuyển đến trang đăng nhập trong giây lát...
        </p>
        <Link href="/login" className="mt-6 block">
          <Button className="bg-blue-primary hover:bg-blue-secondary w-full cursor-pointer">
            Đăng nhập ngay
          </Button>
        </Link>
      </StatusCard>
    );
  }

  if (verifyMutation.isError) {
    const isExpired =
      verifyMutation.error instanceof ApiError &&
      verifyMutation.error.statusCode === 401;

    return (
      <StatusCard
        icon={<XCircle className="h-12 w-12 text-red-500" />}
        title="Xác thực thất bại"
        message={verifyMutation.error.message}
      >
        {isExpired ? (
          <ResendVerificationForm />
        ) : (
          <Link href="/register" className="mt-3 block">
            <Button variant="outline" className="w-full cursor-pointer">
              <MailOpen className="mr-2 h-4 w-4" />
              Đăng ký lại
            </Button>
          </Link>
        )}
      </StatusCard>
    );
  }

  return null;
};

function StatusCard({
  icon,
  title,
  message,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-muted flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-md">
        <div className="mx-auto w-fit">{icon}</div>
        <h2 className="mt-4 text-xl font-semibold text-gray-800">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{message}</p>
        {children}
      </div>
    </div>
  );
}
