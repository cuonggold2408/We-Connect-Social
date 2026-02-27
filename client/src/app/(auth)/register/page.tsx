import RegisterPage from "@/pages/auth/register/RegisterPage";
import { createMetadata } from "@/shared/config/metadata";
import { Metadata } from "next";

export const metadata: Metadata = createMetadata({
  title: "Đăng ký",
  description: "Tạo tài khoản We Connect mới",
});

const RegisterAuthPage = () => {
  return <RegisterPage />;
};

export default RegisterAuthPage;
