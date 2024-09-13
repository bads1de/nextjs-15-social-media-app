import { PostData, PostsPage } from "@/lib/types";
import { useToast } from "../ui/use-toast";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { deletePost } from "./actions";

/**
 * 投稿を削除するためのmutation
 * @param {PostData} post - 削除する投稿データ
 * @returns {object} mutationオブジェクト
 */
export function useDeletePostMutation(post: PostData) {
  const { toast } = useToast();

  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();

  const mutation = useMutation({
    mutationFn: deletePost,
    onSuccess: async (deletedPost) => {
      // "post-feed" というキーを持つクエリ、つまり投稿フィードのクエリを対象とする
      const queryFilter: QueryFilters = { queryKey: ["post-feed"] };

      // 対象のクエリをキャンセルする。これは、古いデータが画面に表示されるのを防ぐため
      await queryClient.cancelQueries(queryFilter);

      // 対象のクエリデータを取得し、削除された投稿を除外したデータで更新する
      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
        queryFilter,
        (oldData) => {
          // 古いデータが存在する場合のみ更新を行う
          if (!oldData) return;

          // 各ページの投稿リストから削除された投稿を除外し、新しいデータを作成する
          // 既存のページデータとカーソルはそのまま保持する
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              nextCursor: page.nextCursor,
              posts: page.posts.filter((p) => p.id !== deletedPost.id),
            })),
          };
        },
      );

      toast({
        description: "投稿を削除しました",
      });

      // 削除された投稿の詳細ページを表示している場合は、ユーザーのプロフィールページに遷移する
      if (pathname === `/posts/${deletedPost.id}`) {
        router.push(`/users/${deletedPost.user.username}`);
      }
    },
    onError(error) {
      console.log(error);
      toast({
        variant: "destructive",
        description: "投稿の削除に失敗しました",
      });
    },
  });

  return mutation;
}
