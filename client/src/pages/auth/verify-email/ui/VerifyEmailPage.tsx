import { Suspense } from "react";
import { VerifyEmailStatus } from "@/features/auth/verify-email/ui/VerifyEmailStatus";

export default function VerifyEmailPage() {
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
      <VerifyEmailStatus />
    </Suspense>
  );
}
