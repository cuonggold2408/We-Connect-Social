import LoginPage from "@/pages/auth/login/LoginPage";
import { createMetadata } from "@/shared/config/metadata";
import { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Đăng nhập",
  description: "Đăng nhập vào tài khoản We Connect",
});

const LoginAuthPage = () => {
  return <LoginPage />;
};

export default LoginAuthPage;
