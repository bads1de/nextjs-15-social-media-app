import { google, lucia } from "@/auth";
import kyInstance from "@/lib/ky";
import prisma from "@/lib/prisma";
import streamServerClient from "@/lib/stream";
import { slugify } from "@/lib/utils";
import { OAuth2RequestError } from "arctic";
import { generateIdFromEntropySize } from "lucia";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

/**
 * Google OAuth2コールバックAPIルート
 *
 * Google OAuth2認証フローのリダイレクトURIとして使用されます。
 * 認証コードを検証し、ユーザーが既に存在する場合はセッションを作成し、
 * 存在しない場合は新規ユーザーを作成してセッションを作成します。
 *
 * @param req Next.js APIルートのリクエストオブジェクト
 * @returns リダイレクトレスポンス
 */
export async function GET(req: NextRequest) {
  // 認可コードとstateを取得
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  // Cookieに保存されているstateとcodeVerifierを取得
  const storedState = cookies().get("state")?.value;
  const storedCodeVerifier = cookies().get("code_verifier")?.value;

  // 認可コード、state、Cookieに保存されているstateとcodeVerifierが存在し、
  // stateが一致することを確認
  if (
    !code ||
    !state ||
    !storedState ||
    !storedCodeVerifier ||
    state !== storedState
  ) {
    // 不正なリクエスト
    return new Response(null, { status: 400 });
  }

  try {
    // 認可コードを検証し、アクセストークンを取得
    const tokens = await google.validateAuthorizationCode(
      code,
      storedCodeVerifier,
    );

    // Google APIからユーザー情報を取得
    const googleUser = await kyInstance
      .get("https://www.googleapis.com/oauth2/v1/userinfo", {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      })
      .json<{ id: string; name: string }>();

    // Google IDでユーザーを検索
    const existingUser = await prisma.user.findUnique({
      where: {
        googleId: googleUser.id,
      },
    });

    // ユーザーが既に存在する場合
    if (existingUser) {
      // セッションを作成
      const session = await lucia.createSession(existingUser.id, {});
      // セッションクッキーを作成
      const sessionCookie = lucia.createSessionCookie(session.id);
      // セッションクッキーを設定
      cookies().set(
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
      // トップページにリダイレクト
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }

    // ユーザーIDを生成
    const userId = generateIdFromEntropySize(10);

    // ユーザー名を作成
    const username = slugify(googleUser.name) + "-" + userId.slice(0, 4);

    // ユーザーとStreamユーザーを作成
    await prisma.$transaction(async (tx) => {
      // ユーザーを作成
      await tx.user.create({
        data: {
          id: userId,
          username,
          displayName: googleUser.name,
          googleId: googleUser.id,
        },
      });
      // Streamユーザーを作成
      await streamServerClient.upsertUser({
        id: userId,
        username,
        name: username,
      });
    });

    // セッションを作成
    const session = await lucia.createSession(userId, {});
    // セッションクッキーを作成
    const sessionCookie = lucia.createSessionCookie(session.id);
    // セッションクッキーを設定
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    // トップページにリダイレクト
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (error) {
    // エラーが発生した場合
    console.error(error);
    // OAuth2RequestErrorの場合は不正なリクエスト
    if (error instanceof OAuth2RequestError) {
      return new Response(null, {
        status: 400,
      });
    }
    // その他のエラーの場合はサーバーエラー
    return new Response(null, {
      status: 500,
    });
  }
}
