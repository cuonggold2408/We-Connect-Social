import { z } from "zod";
import {
  REGEX_PASSWORD,
  PASSWORD_MIN_LENGTH,
} from "@/features/auth/register/model/register.constants";

export const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(PASSWORD_MIN_LENGTH, {
        message: `Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`,
      })
      .regex(REGEX_PASSWORD.HAS_UPPER, {
        message: "Mật khẩu phải chứa ít nhất một chữ in hoa",
      })
      .regex(REGEX_PASSWORD.HAS_NUMBER, {
        message: "Mật khẩu phải chứa ít nhất một số",
      })
      .regex(REGEX_PASSWORD.HAS_SPECIAL, {
        message: "Mật khẩu phải chứa ký tự đặc biệt",
      }),
    confirmPassword: z.string().nonempty({
      message: "Xác nhận mật khẩu không được để trống",
    }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Xác nhận mật khẩu không khớp với mật khẩu",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
