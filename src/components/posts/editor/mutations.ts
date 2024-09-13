import { useToast } from "@/components/ui/use-toast";
import { PostsPage } from "@/lib/types";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { submitPost } from "./actions";

/**
 * 投稿を送信するためのmutation
 * @returns {object} mutationオブジェクト
 */
export function useSubmitPostMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitPost,
    onSuccess: async (newPost) => {
      // "post-feed", "for-you" というキーを持つクエリ、つまり投稿フィードのクエリを対象とする
      const queryFilter: QueryFilters = { queryKey: ["post-feed", "for-you"] };

      // 対象のクエリをキャンセルする。これは、古いデータが画面に表示されるのを防ぐため
      await queryClient.cancelQueries(queryFilter);

      // 対象のクエリデータを取得し、新しい投稿を追加したデータで更新する
      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
        queryFilter,
        (oldData) => {
          // 古いデータの最初のページを取得する。投稿フィードはページングされているため、複数のページが存在する可能性がある
          const firstPage = oldData?.pages[0];

          // 最初のページが存在する場合のみ更新を行う
          if (firstPage) {
            // 新しい投稿を最初のページの先頭に追加し、新しいデータを作成する
            // 既存のページデータはそのまま保持する
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  posts: [newPost, ...firstPage.posts], // 新しい投稿を先頭に追加
                  nextCursor: firstPage.nextCursor,
                },
                ...oldData.pages.slice(1), // 2ページ目以降はそのまま
              ],
            };
          }
        },
      );

      // データがないクエリを無効化し、再取得を促す
      // これは、投稿フィードがまだ読み込まれていない場合に、新しい投稿を含むデータを取得するため
      queryClient.invalidateQueries({
        queryKey: queryFilter.queryKey,
        predicate(query) {
          return !query.state.data;
        },
      });

      toast({
        description: "ポストを投稿しました!",
      });
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "ポストの投稿に失敗しました",
      });
    },
  });

  return mutation;
}
