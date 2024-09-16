import prisma from "@/lib/prisma";
import { UTApi } from "uploadthing/server";

// GETリクエストを処理する関数
export async function GET(req: Request) {
  try {
    // 認証ヘッダーを取得
    const authHeader = req.headers.get("Authorization");

    // 認証ヘッダーがCRON_SECRETと一致しない場合は、401エラーを返す
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    // 未使用のメディアを取得
    // postIdがnullで、本番環境の場合はcreatedAtが24時間前のメディア
    const unusedMedia = await prisma.media.findMany({
      where: {
        postId: null,
        ...(process.env.NODE_ENV === "production"
          ? {
              createdAt: {
                lte: new Date(Date.now() - 1000 * 60 * 60 * 24),
              },
            }
          : {}),
      },
      select: {
        id: true,
        url: true,
      },
    });

    // UploadThingから未使用のメディアを削除
    new UTApi().deleteFiles(
      unusedMedia.map(
        (m) =>
          m.url.split(`/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`)[1],
      ),
    );

    // データベースから未使用のメディアを削除
    await prisma.media.deleteMany({
      where: {
        id: {
          in: unusedMedia.map((m) => m.id),
        },
      },
    });

    // 成功レスポンスを返す
    return new Response();
  } catch (error) {
    // エラーが発生した場合は、500エラーを返す
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
