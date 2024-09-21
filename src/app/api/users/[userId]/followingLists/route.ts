import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { NextRequest } from "next/server";

/**
 * ユーザーがフォローしているユーザーのリストを取得するためのGETリクエストハンドラー
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータを含むオブジェクト
 * @returns フォローしているユーザーのリストをJSON形式で返す
 */
export async function GET(
  request: NextRequest,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // フォローしているユーザーをデータベースから取得
    const followingUsers = await prisma.user.findMany({
      where: {
        followers: {
          some: {
            followerId: userId, // 指定されたuserIdをフォローしているユーザーを検索
          },
        },
        ...(userId === user.id ? { id: { not: user.id } } : {}), // 自分自身を除外
      },
      select: getUserDataSelect(user.id), // ユーザーデータの選択
    });

    return Response.json(followingUsers);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
