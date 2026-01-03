import { RegisterForm } from "@/features/auth/register/ui/RegisterForm";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="bg-muted flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-md">
        {/* Header Section */}
        <div className="mb-6 flex flex-col items-center">
          <Image src="/weconnect-logo.png" alt="logo" width={58} height={55} />
        </div>
        <h1 className="my-2 text-xl font-bold text-gray-800">Đăng ký 🚀</h1>

        {/* Feature Form */}
        <RegisterForm />
      </div>
    </div>
  );
}
