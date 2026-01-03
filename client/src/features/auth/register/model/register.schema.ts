import { z } from "zod";
import { REGEX_PASSWORD, PASSWORD_MIN_LENGTH } from "./register.constants";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username phải có ít nhất 3 ký tự" })
    .max(20, { message: "Username không được quá 20 ký tự" }),

  email: z.string().email({ message: "Email không hợp lệ" }),

  password: z
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
});

export type RegisterValues = z.infer<typeof registerSchema>;
