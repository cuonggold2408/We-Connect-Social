import ForgotPasswordPage from "@/pages/auth/forgot-password/ForgotPasswordPage";
import { createMetadata } from "@/shared/config/metadata";
import { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Quên mật khẩu",
  description: "Đặt lại mật khẩu tài khoản We Connect",
});

const ForgotPasswordAuthPage = () => {
  return <ForgotPasswordPage />;
};

export default ForgotPasswordAuthPage;
