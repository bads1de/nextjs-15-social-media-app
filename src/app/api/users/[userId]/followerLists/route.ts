import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { NextRequest } from "next/server";

/**
 * ユーザーがフォローしているユーザーのリストを取得するためのGETリクエストハンドラー
 * @param req - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータを含むオブジェクト
 * @returns フォローしているユーザーのリストをJSON形式で返す
 */
export async function GET(
  req: NextRequest,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // フォロワーをデータベースから取得
    const followerUsers = await prisma.user.findMany({
      where: {
        following: {
          some: {
            followingId: userId, // 指定されたuserIdをフォローしているユーザーを検索
          },
        },
        ...(userId === user.id ? { id: { not: user.id } } : {}), // 自分自身を除外
      },
      select: getUserDataSelect(user.id), // ユーザーデータの選択
    });

    return Response.json(followerUsers);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
