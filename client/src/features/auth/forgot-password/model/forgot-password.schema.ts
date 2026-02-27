import { z } from "zod";

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Email không hợp lệ" }),
});

export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;
