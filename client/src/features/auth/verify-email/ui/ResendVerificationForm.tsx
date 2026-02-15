import { authApi } from "@/shared/api/auth.api";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { useState } from "react";

const ResendVerificationForm = () => {
  const [email, setEmail] = useState("");
  const resendMutation = useMutation({
    mutationFn: (email: string) => authApi.resendVerification(email),
  });
  const handleResend = () => {
    if (!email.trim()) return;
    resendMutation.mutate(email);
  };
  if (resendMutation.isSuccess) {
    return (
      <div className="mt-4 rounded-lg bg-green-50 p-4">
        <p className="text-sm font-medium text-green-700">
          {resendMutation.data.message}
        </p>
      </div>
    );
  }
  return (
    <div className="mt-6 space-y-3">
      <p className="text-sm text-gray-500">
        Nhập email để nhận lại link xác thực:
      </p>
      <Input
        type="email"
        placeholder="email@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleResend()}
      />
      {resendMutation.isError && (
        <p className="text-xs text-red-500">{resendMutation.error.message}</p>
      )}
      <Button
        onClick={handleResend}
        variant="outline"
        className="w-full cursor-pointer"
        disabled={resendMutation.isPending || !email.trim()}
      >
        {resendMutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="mr-2 h-4 w-4" />
        )}
        {resendMutation.isPending ? "Đang gửi..." : "Gửi lại email xác thực"}
      </Button>
    </div>
  );
};

export default ResendVerificationForm;
