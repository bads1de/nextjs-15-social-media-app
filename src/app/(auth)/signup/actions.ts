"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { signUpSchema, SignUpValues } from "@/lib/validation";
import { hash } from "@node-rs/argon2";
import { generateIdFromEntropySize } from "lucia";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * ユーザーサインアップ処理
 *
 * @param credentials ユーザーのサインアップ情報
 * @returns エラーメッセージまたはリダイレクト
 */
export async function signUp(
  credentials: SignUpValues,
): Promise<{ error: string }> {
  try {
    // バリデーション
    const { email, username, password } = signUpSchema.parse(credentials);

    // パスワードハッシュ化
    const passwordHash = await hash(password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // ユーザーID生成
    const userId = generateIdFromEntropySize(10);

    // ユーザー名の重複チェック
    const existingUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    // ユーザー名が既に存在する場合
    if (existingUsername) {
      return { error: "このユーザー名は既に使用されています" };
    }

    // メールアドレスの重複チェック
    const existingEmail = await prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive",
        },
      },
    });

    // メールアドレスが既に存在する場合
    if (existingEmail) {
      return { error: "このメールアドレスは既に使用されています" };
    }

    // ユーザー情報の登録
    await prisma.user.create({
      data: {
        id: userId,
        username,
        displayName: username,
        email,
        passwordHash,
      },
    });

    // セッションの作成
    const session = await lucia.createSession(userId, {});
    // セッションクッキーの作成
    const sessionCookie = lucia.createSessionCookie(session.id);
    // セッションクッキーの設定
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    // トップページへリダイレクト
    return redirect("/");
  } catch (error) {
    // リダイレクトエラーの場合はそのまま投げる
    if (isRedirectError(error)) throw error;
    // エラーログ出力
    console.error(error);
    // エラーメッセージを返す
    return { error: "サインアップに失敗しました" };
  }
}
