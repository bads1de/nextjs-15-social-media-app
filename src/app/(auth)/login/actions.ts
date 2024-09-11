"use server";

import { lucia } from "@/auth";
import prisma from "@/lib/prisma";
import { loginSchema, LoginValues } from "@/lib/validation";
import { verify } from "@node-rs/argon2";
import { isRedirectError } from "next/dist/client/components/redirect";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * ユーザーログイン処理
 *
 * @param credentials ユーザーのログイン情報
 * @returns エラーメッセージまたはリダイレクト
 */
export async function login(
  credentials: LoginValues,
): Promise<{ error: string }> {
  try {
    // バリデーション
    const { username, password } = loginSchema.parse(credentials);

    // ユーザー情報の取得
    const existingUser = await prisma.user.findFirst({
      where: {
        username: {
          equals: username,
          mode: "insensitive",
        },
      },
    });

    // ユーザーが存在しない場合、またはパスワードハッシュが存在しない場合
    if (!existingUser || !existingUser.passwordHash) {
      return { error: "ユーザー名またはパスワードが正しくありません" };
    }

    // パスワードの検証
    const validPassword = await verify(existingUser.passwordHash, password, {
      memoryCost: 19456,
      timeCost: 2,
      outputLen: 32,
      parallelism: 1,
    });

    // パスワードが正しくない場合
    if (!validPassword) {
      return { error: "ユーザー名またはパスワードが正しくありません" };
    }

    // セッションの作成
    const session = await lucia.createSession(existingUser.id, {});
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
    return { error: "ログインに失敗しました" };
  }
}
