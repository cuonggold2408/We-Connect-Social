import LoginForm from "@/features/auth/login/ui/LoginForm";
import Image from "next/image";

const LoginPage = () => {
  return (
    <div className="bg-muted flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        {/* Header Section */}
        <div className="mb-6 flex flex-col items-center">
          <Image src="/weconnect-logo.png" alt="logo" width={58} height={55} />
        </div>
        <h1 className="text-md my-2 font-bold text-gray-800">
          Chào mừng đến với mạng xã hội WeConnect! 👋
        </h1>

        <h3 className="my-2 text-sm text-gray-500">
          Đăng nhập để bắt đầu trải nghiệm!
        </h3>

        {/* Feature Form */}
        <LoginForm />
      </div>
    </div>
  );
};

export default LoginPage;
