import VerifyEmailPage from "@/pages/auth/verify-email/VerifyEmailPage";
import { createMetadata } from "@/shared/config/metadata";
import { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Xác thực Email",
  description: "Xác thực tài khoản We Connect của bạn",
});

export default function VerifyEmailAuthPage() {
  return <VerifyEmailPage />;
}
