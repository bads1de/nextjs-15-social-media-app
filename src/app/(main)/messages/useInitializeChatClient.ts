import kyInstance from "@/lib/ky";
import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useSession } from "../SessionProvider";

/**
 * Stream Chatのクライアントを初期化し、ユーザーを接続するフックです。
 *
 * @returns {StreamChat | null} - Stream Chatクライアント、または初期化されていない場合はnull
 */
export default function useInitializeChatClient() {
  // セッション情報からユーザーデータを取得
  const { user } = useSession();
  // Stream Chatクライアントの状態を管理
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    // Stream Chatクライアントをインスタンス化
    const client = StreamChat.getInstance(process.env.NEXT_PUBLIC_STREAM_KEY!);

    // ユーザーを接続
    client
      .connectUser(
        {
          id: user.id,
          username: user.username,
          name: user.displayName,
          image: user.avatarUrl,
        },
        // サーバーからトークンを取得
        async () =>
          kyInstance
            .get("/api/get-token")
            .json<{ token: string }>()
            .then((data) => data.token),
      )
      // 接続エラーを処理
      .catch((error) => console.error("ユーザーの接続に失敗しました", error))
      // 接続成功時にクライアントを状態に設定
      .then(() => setChatClient(client));

    // クリーンアップ関数：コンポーネントがアンマウントされる際にユーザーを切断
    return () => {
      // クライアントの状態をnullに設定
      setChatClient(null);
      // ユーザーを切断
      client
        .disconnectUser()
        // 切断エラーを処理
        .catch((error) => console.error("ユーザーの切断に失敗しました", error))
        // 切断成功時にログを出力
        .then(() => console.log("接続が閉じられました"));
    };
  }, [user.id, user.username, user.displayName, user.avatarUrl]);

  // 初期化されたStream Chatクライアントを返す
  return chatClient;
}
