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

export type SignUpValues = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  username: requiredString,
  password: requiredString,
});

export type LoginValues = z.infer<typeof loginSchema>;

export const createPostSchema = z.object({
  content: requiredString,
  mediaIds: z.array(z.string()).max(5, "最大で5つ選択できます"),
});

export const updateUserProfileSchema = z.object({
  displayName: requiredString,
  bio: z.string().max(1000, "1000文字以内で入力してください"),
});

export type UpdateUserProfileValues = z.infer<typeof updateUserProfileSchema>;

export const createCommentSchema = z.object({
  content: requiredString,
});
