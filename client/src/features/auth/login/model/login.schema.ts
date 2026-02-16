import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
  password: z.string().trim().nonempty({
    message: "Mật khẩu không được để trống",
  }),
});

export type LoginValues = z.infer<typeof loginSchema>;
