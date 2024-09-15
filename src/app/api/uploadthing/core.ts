import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { createUploadthing, FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";

// UploadThingのインスタンスを作成
const f = createUploadthing();

/**
 * ファイルルーター
 *
 * avatar: アバター画像のアップロード
 * attachment: 添付ファイル（画像または動画）のアップロード
 */
export const fileRouter = {
  // アバター画像のアップロード
  avatar: f({
    image: { maxFileSize: "512KB" }, // 画像の最大ファイルサイズを512KBに設定
  })
    .middleware(async () => {
      // リクエストを検証し、ユーザーを取得
      const { user } = await validateRequest();

      // ユーザーが認証されていない場合はエラーをスロー
      if (!user) throw new UploadThingError("Unauthorized");

      // ユーザーをメタデータとして返す
      return { user };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // 以前のアバターURLを取得
      const oldAvatarUrl = metadata.user.avatarUrl;

      // 以前のアバターURLが存在する場合は、以前のアバターファイルを削除
      if (oldAvatarUrl) {
        const key = oldAvatarUrl.split(
          `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
        )[1];

        await new UTApi().deleteFiles(key);
      }

      // 新しいアバターURLを作成
      const newAvatarUrl = file.url.replace(
        "/f/",
        `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
      );

      // ユーザーのアバターURLを更新
      await prisma.user.update({
        where: { id: metadata.user.id },
        data: {
          avatarUrl: newAvatarUrl,
        },
      });

      // 新しいアバターURLを返す
      return { avatarUrl: newAvatarUrl };
    }),
  // 添付ファイル（画像または動画）のアップロード
  attachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 }, // 画像の最大ファイルサイズを4MB、最大ファイル数を5に設定
    video: { maxFileSize: "64MB", maxFileCount: 5 }, // 動画の最大ファイルサイズを64MB、最大ファイル数を5に設定
  })
    .middleware(async () => {
      // リクエストを検証し、ユーザーを取得
      const { user } = await validateRequest();

      // ユーザーが認証されていない場合はエラーをスロー
      if (!user) throw new UploadThingError("Unauthorized");

      // 空のオブジェクトを返す
      return {};
    })
    .onUploadComplete(async ({ file }) => {
      // メディアを作成
      const media = await prisma.media.create({
        data: {
          url: file.url.replace(
            "/f/",
            `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/`,
          ),
          type: file.type.startsWith("image") ? "IMAGE" : "VIDEO",
        },
      });

      // メディアIDを返す
      return { mediaId: media.id };
    }),
} satisfies FileRouter;

// ファイルルーターの型
export type AppFileRouter = typeof fileRouter;
