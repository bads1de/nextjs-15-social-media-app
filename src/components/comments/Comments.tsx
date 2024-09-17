import { CommentsPage, PostData } from "@/lib/types";
import CommentInput from "./CommentInput";
import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import Comment from "./Comment";
import { Button } from "../ui/button";
import { Loader2 } from "lucide-react";

interface CommentsProps {
  post: PostData;
}

export default function Comments({ post }: CommentsProps) {
  /**
   * useInfiniteQueryを使って、コメントを無限スクロールで取得する
   *
   * @see https://tanstack.com/query/v4/docs/react/reference/useInfiniteQuery
   */
  const { data, fetchNextPage, hasNextPage, isFetching, status } =
    useInfiniteQuery({
      /**
       * クエリのキー。キャッシュのキーとして使われる
       * `postId` を含めることで、投稿ごとに異なるキャッシュを持つ
       */
      queryKey: ["comments", post.id],
      /**
       * データを取得する関数
       *
       * @param pageParam - 次のページを取得するためのパラメータ
       * @returns Promise<CommentsPage> - コメントデータのPromise
       */
      queryFn: async ({ pageParam }) => {
        const res = await kyInstance.get(
          `/api/posts/${post.id}/comments`,
          pageParam ? { searchParams: { cursor: pageParam } } : {},
        );
        return res.json<CommentsPage>();
      },
      /**
       * 最初のページのパラメータ
       * `null` を指定することで、最初のページを取得する
       */
      initialPageParam: null as string | null,
      /**
       * 次のページのパラメータを取得する関数
       *
       * @param firstPage - 最初のページのデータ
       * @returns string | null - 次のページのパラメータ。次のページがない場合は `null` を返す
       */
      getNextPageParam: (firstPage) => firstPage.previousCursor,
      /**
       * データを変換する関数
       *
       * @param data - useInfiniteQuery から返されたデータ
       * @returns object - 変換後のデータ
       *
       * ここでは、ページの順番を逆転させている
       * これは、新しいコメントが上に表示されるようにするため
       */
      select: (data) => ({
        pages: [...data.pages].reverse(),
        pageParams: [...data.pageParams].reverse(),
      }),
    });

  const comments = data?.pages.flatMap((page) => page.comments) || [];

  return (
    <div className="space-y-3">
      <CommentInput post={post} />
      {hasNextPage && (
        <Button
          variant="link"
          className="mx-auto block"
          disabled={isFetching}
          onClick={() => fetchNextPage()}
        >
          以前のコメントを読み込む
        </Button>
      )}
      {status === "pending" && <Loader2 className="mx-auto animate-spin" />}
      {status === "success" && !comments.length && (
        <p className="text-center text-muted-foreground">
          まだコメントはありません。
        </p>
      )}
      {status === "error" && (
        <p className="text-center text-destructive">
          コメントの読み込み中にエラーが発生しました。
        </p>
      )}
      <div className="divide-y">
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  );
}
