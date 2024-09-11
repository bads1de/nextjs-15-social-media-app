import { z } from "zod";

const requiredString = z.string().trim().min(1, "必須項目です");

export const signUpSchema = z.object({
  email: requiredString.email("有効なメールアドレスを入力してください"),
  username: requiredString.regex(
    /^[a-zA-Z0-9_-]+$/,
    "使用できる文字は英数字、-、_のみです",
  ),
  password: requiredString.min(8, "パスワードは8文字以上で入力してください"),
});

export type SignUpSchema = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: requiredString,
  password: requiredString,
});

export type LoginSchema = z.infer<typeof loginSchema>;
