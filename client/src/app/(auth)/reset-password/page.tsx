import ResetPasswordPage from "@/pages/auth/reset-password/ResetPasswordPage";
import { createMetadata } from "@/shared/config/metadata";
import { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Đặt lại mật khẩu",
  description: "Đặt lại mật khẩu tài khoản We Connect",
});

export default function ResetPasswordAuthPage() {
  return <ResetPasswordPage />;
}
