import { CommentsPage } from "@/lib/types";
import {
  InfiniteData,
  QueryKey,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useToast } from "../ui/use-toast";
import { deleteComment, submitComment } from "./actions";
/**
 * コメントを送信するためのmutation
 * @param postId - 投稿ID
 * @returns mutation - mutationオブジェクト
 */
export function useSubmitCommentMutation(postId: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: submitComment,
    onSuccess: async (newComment) => {
      const queryKey: QueryKey = ["comments", postId];

      await queryClient.cancelQueries({ queryKey });

      // コメント投稿後のキャッシュ更新処理
      queryClient.setQueryData<InfiniteData<CommentsPage, string | null>>(
        queryKey,
        (oldData) => {
          const firstPage = oldData?.pages[0];

          if (firstPage) {
            // 古いデータの最初のページに新しいコメントを追加し、新しいデータを作成
            return {
              pageParams: oldData.pageParams,
              pages: [
                {
                  previousCursor: firstPage.previousCursor,
                  comments: [...firstPage.comments, newComment],
                },
                ...oldData.pages.slice(1),
              ],
            };
          }
        },
      );

      // データがないクエリを無効化し、再取得を促す
      queryClient.invalidateQueries({
        queryKey,
        predicate(query) {
          return !query.state.data;
        },
      });

      toast({
        description: "コメントを投稿しました!",
      });
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "コメントの投稿に失敗しました",
      });
    },
  });

  return mutation;
}

/**
 * コメントを削除するためのmutation
 * @returns mutation - mutationオブジェクト
 */
export function useDeleteCommentMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: deleteComment,
    onSuccess: async (deleteComment) => {
      const queryKey: QueryKey = ["comments", deleteComment.id];

      await queryClient.cancelQueries({ queryKey });

      // コメント削除後のキャッシュ更新処理
      queryClient.setQueryData<InfiniteData<CommentsPage, string | null>>(
        queryKey,
        (oldData) => {
          if (!oldData) return;

          // 削除されたコメントを除外した新しいデータを作成
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              previousCursor: page.previousCursor,
              comments: page.comments.filter((c) => c.id !== deleteComment.id),
            })),
          };
        },
      );

      toast({
        description: "コメントを削除しました",
      });
    },
    onError(error) {
      console.error(error);
      toast({
        variant: "destructive",
        description: "コメントの削除に失敗しました",
      });
    },
  });

  return mutation;
}
