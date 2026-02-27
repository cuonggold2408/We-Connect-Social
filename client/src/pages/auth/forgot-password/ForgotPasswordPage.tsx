import ForgotPasswordForm from "@/features/auth/forgot-password/ui/ForgotPasswordForm";
import Image from "next/image";

const ForgotPasswordPage = () => {
  return (
    <div className="bg-muted flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        <div className="mb-6 flex flex-col items-center">
          <Image src="/weconnect-logo.png" alt="logo" width={58} height={55} />
        </div>
        <h1 className="text-md mt-2 font-bold text-gray-800">Quên mật khẩu</h1>
        <h3 className="mb-4 text-sm text-gray-500">
          Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu
        </h3>
        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
