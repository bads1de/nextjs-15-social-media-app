import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

/**
 * 検索APIのGETリクエストハンドラ
 * @param request Next.jsのRequestオブジェクト
 * @returns 検索結果を含むレスポンス
 */
export async function GET(request: NextRequest) {
  try {
    // クエリパラメータから検索クエリとカーソルを取得
    const q = request.nextUrl.searchParams.get("q") || "";
    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;

    // 検索クエリをスペースで分割し、AND検索用に結合
    const searchQuery = q.split(" ").join(" & ");

    // 1ページあたりの投稿数
    const pageSize = 10;

    // リクエストの認証
    const { user } = await validateRequest();

    // 認証に失敗した場合、401エラーを返す
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Prismaを使用して投稿を検索
    const posts = await prisma.post.findMany({
      where: {
        // 投稿コンテンツ、ユーザー名、表示名で検索
        OR: [
          {
            content: {
              search: searchQuery,
            },
          },
          {
            user: {
              displayName: {
                search: searchQuery,
              },
            },
          },
          {
            user: {
              username: {
                search: searchQuery,
              },
            },
          },
        ],
      },
      // 投稿データに必要な情報をインクルード
      include: getPostDataInclude(user.id),
      // 作成日時で降順にソート
      orderBy: { createdAt: "desc" },
      // ページサイズ + 1件を取得 (次のカーソル判定のため)
      take: pageSize + 1,
      // カーソルが指定されている場合はカーソルから取得
      cursor: cursor ? { id: cursor } : undefined,
    });

    // 次のカーソルを判定
    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    // レスポンスデータを作成
    const data: PostsPage = {
      posts: posts.slice(0, pageSize),
      nextCursor,
    };

    // レスポンスをJSON形式で返す
    return Response.json(data);
  } catch (error) {
    // エラーが発生した場合、エラーログを出力し、500エラーを返す
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
