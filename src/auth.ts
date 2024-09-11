import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { Lucia, Session, User } from "lucia";
import { cookies } from "next/headers";
import { cache } from "react";
import prisma from "./lib/prisma";

// Prismaアダプターを初期化します。
// PrismaAdapterは、Prismaを使用してセッションとユーザーデータを管理するためのアダプターです。
const adapter = new PrismaAdapter(prisma.session, prisma.user);

// Luciaを初期化します。
// Luciaは、認証と認可のためのライブラリです。
export const lucia = new Lucia(adapter, {
  // セッションクッキーの設定
  sessionCookie: {
    // セッションクッキーの有効期限をfalseに設定することで、ブラウザが閉じられるまでクッキーが有効になります。
    expires: false,
    // セッションクッキーの属性を設定します。
    attributes: {
      // 本番環境では、セキュア属性をtrueに設定することで、HTTPSでのみクッキーが送信されるようにします。
      secure: process.env.NODE_ENV === "production",
    },
  },
  // データベースユーザー属性からユーザー属性を取得するための関数を設定します。
  getUserAttributes(databaseUserAttributes) {
    // データベースユーザー属性から必要な属性を抽出して返します。
    return {
      id: databaseUserAttributes.id,
      username: databaseUserAttributes.username,
      displayName: databaseUserAttributes.displayName,
      avatarUrl: databaseUserAttributes.avatarUrl,
      googleId: databaseUserAttributes.googleId,
    };
  },
});

// Luciaの型定義を拡張します。
// Luciaの型定義に、Luciaインスタンスとデータベースユーザー属性の型を追加します。
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

// データベースユーザー属性のインターフェースを定義します。
// データベースユーザー属性は、ユーザーに関する情報を格納するオブジェクトです。
interface DatabaseUserAttributes {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  googleId: string | null;
}

/**
 * リクエストを検証します。
 * リクエストに含まれるセッションIDを使用して、セッションを検証します。
 * セッションが有効な場合は、ユーザーとセッションを返します。
 * セッションが無効な場合は、nullを返します。
 * @returns ユーザーとセッション、またはnullを返します。
 */
export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    // セッションIDを取得します。
    // セッションIDは、クッキーから取得します。
    const sessionId = cookies().get(lucia.sessionCookieName)?.value ?? null;

    // セッションIDが存在しない場合は、nullを返します。
    // セッションIDが存在しない場合は、ユーザーがログインしていないことを意味します。
    if (!sessionId) {
      return {
        user: null,
        session: null,
      };
    }

    // セッションを検証します。
    // セッションを検証するには、LuciaのvalidateSessionメソッドを使用します。
    const result = await lucia.validateSession(sessionId);

    // セッションが有効な場合は、セッションクッキーを更新します。
    // セッションクッキーを更新することで、セッションの有効期限を延長します。
    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
      // セッションが無効な場合は、空のセッションクッキーを作成します。
      // 空のセッションクッキーを作成することで、セッションを無効化します。
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
    } catch {}

    // 結果を返します。
    // 結果は、ユーザーとセッション、またはnullです。
    return result;
  },
);
