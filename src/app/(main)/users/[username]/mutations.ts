import { useToast } from "@/components/ui/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import {
  InfiniteData,
  QueryFilters,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { UpdateUserProfileValues } from "@/lib/validation";
import { updateUserProfile } from "./actions";
import { PostsPage } from "@/lib/types";

/**
 * プロフィール更新ミューテーション
 *
 * @returns プロフィール更新ミューテーション
 */
export function useUpdateProfileMutation() {
  const { toast } = useToast();

  const router = useRouter();

  const queryClient = useQueryClient();

  // UploadThingの初期化
  // avatarはUploadThingのファイル名
  const { startUpload: startAvatarUpload } = useUploadThing("avatar");

  /**
   * プロフィール更新ミューテーション
   *
   * @see https://tanstack.com/query/v4/docs/react/reference/useMutation
   */
  const mutation = useMutation({
    mutationFn: async ({
      values,
      avatar,
    }: {
      values: UpdateUserProfileValues;
      avatar?: File;
    }) => {
      // プロフィール更新とアバターアップロードを並行して実行
      return Promise.all([
        updateUserProfile(values),
        avatar && startAvatarUpload([avatar]),
      ]);
    },
    onSuccess: async ([updatedUser, uploadResult]) => {
      // 新しいアバターURLを取得
      const newAvatarUrl = uploadResult?.[0].serverData.avatarUrl;

      // クエリのフィルター
      const queryFilter: QueryFilters = {
        queryKey: ["post-feed"],
      };

      // post-feedクエリのキャッシュを無効化
      await queryClient.cancelQueries(queryFilter);

      // post-feedクエリのキャッシュを更新
      queryClient.setQueriesData<InfiniteData<PostsPage, string | null>>(
        queryFilter,
        (oldData) => {
          // キャッシュが存在しない場合は何もしない
          if (!oldData) return;

          // キャッシュを更新
          return {
            pageParams: oldData.pageParams,
            pages: oldData.pages.map((page) => ({
              nextCursor: page.nextCursor,
              posts: page.posts.map((post) => {
                // 更新されたユーザーの投稿のみアバターURLを更新
                if (post.user.id === updatedUser.id) {
                  return {
                    ...post,
                    user: {
                      ...updatedUser,
                      avatarUrl: newAvatarUrl || updatedUser.avatarUrl,
                    },
                  };
                }
                // それ以外の投稿はそのまま
                return post;
              }),
            })),
          };
        },
      );

      router.refresh();

      toast({
        description: "プロフィールを更新しました",
      });
    },
    onError: (error) => {
      console.error(error);

      toast({
        variant: "destructive",
        description: "プロフィールの更新に失敗しました",
      });
    },
  });

  return mutation;
}
