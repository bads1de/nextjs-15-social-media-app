import { useToast } from "@/components/ui/use-toast";
import { PostsPage } from "@/lib/types";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { submitPost } from "./actions";
import { useSession } from "@/app/(main)/SessionProvider";

/**
 * 投稿を送信するためのmutationを作成し、成功時のフィードバック処理やクエリキャッシュの更新を行う。
 *
 * - 新しい投稿を最初のページの先頭に追加する。
 * - 対象のクエリをキャンセルしてから、古いデータに新しい投稿を追加したクエリキャッシュを設定。
 * - その後、データのないクエリを無効化して再取得を促すことで、新しい投稿が適切に表示されるようにする。
 * - 成功時にはトーストで通知を表示し、エラー時にもエラーメッセージをトーストで表示する。
 *
 * @returns {object} mutationオブジェクト
 */
export function useSubmitPostMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useSession();

  // 投稿送信に使用するmutationを作成
  const mutation = useMutation({
    // 投稿を送信するための関数を設定
    mutationFn: submitPost,
    // 成功時の処理
    onSuccess: async (newPost) => {
      // 投稿フィードのクエリを対象とするフィルター設定
      const queryFilter = {
        queryKey: ["post-feed"],
        predicate(query) {
          return (
            query.queryKey.includes("for-you") || // "for-you" フィードも対象
            (query.queryKey.includes("post-feed") &&
              query.queryKey.includes(user.id)) // 特定のユーザーのフィードも対象
          );
        },
      } satisfies QueryFilters;

      // 対象のクエリをキャンセルし、古いデータが表示されないようにする
      await queryClient.cancelQueries(queryFilter);

      // クエリキャッシュに存在するデータを更新する
      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
        queryFilter,
        (oldData) => {
          // 最初のページを取得（ページングされている場合を考慮）
          const firstPage = oldData?.pages[0];

          // 最初のページが存在する場合のみ、新しい投稿を追加して更新
          if (firstPage) {
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  posts: [newPost, ...firstPage.posts], // 新しい投稿をページの先頭に追加
                  nextCursor: firstPage.nextCursor, // 次のページのカーソルを保持
                },
                ...oldData.pages.slice(1), // 2ページ目以降のデータはそのまま保持
              ],
            };
          }
        },
      );

      // データがないクエリを無効化し、再取得を促す
      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
        predicate(query) {
          // まだデータが存在しない場合にのみ再取得
          return queryFilter.predicate(query) && !query.state.data;
        },
      });

      // 成功時のトースト通知を表示
      toast({
        description: "ポストを投稿しました!",
      });
    },

    // エラー時の処理
    onError(error) {
      console.error(error);

      // エラー通知をトーストで表示
      toast({
        variant: "destructive",
        description: "ポストの投稿に失敗しました",
      });
    },
  });

  // mutationオブジェクトを返す
  return mutation;
}
