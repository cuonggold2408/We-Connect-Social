import { Suspense } from "react";
import ResetPasswordForm from "@/features/auth/reset-password/ui/ResetPasswordForm";
import Image from "next/image";

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-muted flex min-h-screen items-center justify-center">
          <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-md">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500">Đang tải...</p>
          </div>
        </div>
      }
    >
      <div className="bg-muted flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
          <div className="mb-6 flex flex-col items-center">
            <Image
              src="/weconnect-logo.png"
              alt="logo"
              width={58}
              height={55}
            />
          </div>
          <h1 className="text-md my-2 font-bold text-gray-800">
            Đặt lại mật khẩu
          </h1>
          <ResetPasswordForm />
        </div>
      </div>
    </Suspense>
  );
}
