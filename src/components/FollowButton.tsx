"use client";

import useFollowerInfo from "@/hooks/useFollowerInfo";
import kyInstance from "@/lib/ky";
import { FollowerInfo } from "@/lib/types";
import { QueryKey, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";

interface FollowButtonProps {
  userId: string;
  initialState: FollowerInfo;
}

export default function FollowButton({
  userId,
  initialState,
}: FollowButtonProps) {
  const { toast } = useToast();
  const { data } = useFollowerInfo(userId, initialState);

  const queryClient = useQueryClient();
  const queryKey: QueryKey = ["follower-info", userId];

  /**
   * フォロー/フォロー解除を行うMutation
   *
   * @remarks
   * useMutationフックを使用して、フォロー/フォロー解除の非同期処理を管理します。
   *
   * mutationFn: フォロー/フォロー解除を行うAPIリクエストを送信する関数
   * onMutate: APIリクエストが送信される前に実行される関数。ここでは、楽観的なUI更新を行い、キャッシュを更新します。
   * onError: APIリクエストが失敗した場合に実行される関数。ここでは、エラーメッセージを表示し、キャッシュを以前の状態に戻します。
   */
  const { mutate } = useMutation({
    mutationFn: () =>
      data.isFollowedByUser
        ? kyInstance.delete(`/api/users/${userId}/followers`)
        : kyInstance.post(`/api/users/${userId}/followers`),
    onMutate: async () => {
      // 現在のクエリをキャンセル
      await queryClient.cancelQueries({ queryKey });

      // 以前のキャッシュデータを取得
      const previousState = queryClient.getQueryData<FollowerInfo>(queryKey);

      // 楽観的なUI更新
      // フォロー/フォロー解除の状態を反転させ、フォロワー数を更新
      queryClient.setQueryData<FollowerInfo>(queryKey, () => ({
        followers:
          (previousState?.followers || 0) +
          (previousState?.isFollowedByUser ? -1 : 1),
        isFollowedByUser: !previousState?.isFollowedByUser,
      }));

      // エラー発生時にキャッシュを戻すために、以前の状態を返す
      return { previousState };
    },
    onError(error, variables, context) {
      // エラー発生時、キャッシュを以前の状態に戻す
      queryClient.setQueryData<FollowerInfo>(queryKey, context?.previousState);
      console.error(error);
      // エラートーストを表示
      toast({
        title: "エラー",
        description: "フォローの変更に失敗しました",
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      variant={data.isFollowedByUser ? "secondary" : "default"}
      onClick={() => mutate()}
    >
      {data.isFollowedByUser ? "解除" : "フォロー"}
    </Button>
  );
}
