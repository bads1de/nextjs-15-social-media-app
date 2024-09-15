import { useToast } from "@/components/ui/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import { useState } from "react";

/**
 * 添付ファイルのインターフェース
 */
export interface Attachment {
  /** ファイル */
  file: File;
  /** メディアID */
  mediaId?: string;
  /** アップロード中かどうか */
  isUploading: boolean;
}

/**
 * メディアアップロード用のフック
 * @returns メディアアップロード用の関数と状態
 */
export function useMediaUpload() {
  const { toast } = useToast();

  /** 添付ファイルのリスト */
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  /** アップロードの進捗状況 */
  const [uploadProgress, setUploadProgress] = useState<number>();

  /** UploadThingのフック */
  const { startUpload, isUploading } = useUploadThing("attachment", {
    /** アップロード開始前の処理 */
    onBeforeUploadBegin(files) {
      // ファイル名をランダムなUUIDに変更する
      const renamedFiles = files.map((file) => {
        const extension = file.name.split(".").pop();
        return new File(
          [file],
          `attachment_${crypto.randomUUID()}.${extension}`,
          { type: file.type },
        );
      });

      // 添付ファイルのリストに追加する
      setAttachments((prev) => [
        ...prev,
        ...renamedFiles.map((file) => ({ file, isUploading: true })),
      ]);
      return renamedFiles;
    },
    /** アップロード進捗時の処理 */
    onUploadProgress: setUploadProgress,
    /** クライアント側でのアップロード完了時の処理 */
    onClientUploadComplete(res) {
      // 添付ファイルのリストを更新する
      setAttachments((prev) =>
        prev.map((a) => {
          const uploadResult = res.find((r) => r.name === a.file.name);

          if (!uploadResult) return a;

          return {
            ...a,
            isUploading: false,
            mediaId: uploadResult.serverData.mediaId,
          };
        }),
      );
    },
    /** アップロードエラー時の処理 */
    onUploadError(e) {
      // アップロード中の添付ファイルをリストから削除する
      setAttachments((prev) => prev.filter((a) => !a.isUploading));
      // エラートーストを表示する
      toast({
        variant: "destructive",
        description: "添付ファイルのアップロードに失敗しました",
      });
    },
  });

  /**
   * アップロードを開始する関数
   * @param files アップロードするファイルのリスト
   */
  function handleStartUpload(files: File[]) {
    // アップロード中の場合はエラーメッセージを表示する
    if (isUploading) {
      toast({
        variant: "destructive",
        description: "アップロード中です",
      });
      return;
    }

    // 5つ以上の添付ファイルはアップロードできないようにする
    if (arguments.length + attachments.length > 5) {
      toast({
        variant: "destructive",
        description: "5つ以上の添付ファイルをアップロードできません",
      });
      return;
    }

    // アップロードを開始する
    startUpload(files);
  }

  /**
   * 添付ファイルを削除する関数
   * @param fileName 削除するファイル名
   */
  function removeAttachment(fileName: string) {
    // 添付ファイルのリストから削除する
    setAttachments((prev) => prev.filter((a) => a.file.name !== fileName));
  }

  /**
   * 添付ファイルの状態をリセットする関数
   */
  function reset() {
    setAttachments([]);
    setUploadProgress(undefined);
  }

  return {
    startUpload: handleStartUpload,
    attachments,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset,
  };
}
