import kyInstance from "@/lib/ky";
import { BookmarkInfo } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  QueryKey,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Bookmark } from "lucide-react";
import { useToast } from "../ui/use-toast";

interface BookmarkButtonProps {
  postId: string;
  initialState: BookmarkInfo;
}

export default function BookmarkButton({
  postId,
  initialState,
}: BookmarkButtonProps) {
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const QueryKey: QueryKey = ["bookmark-info", postId];

  const { data } = useQuery({
    queryKey: QueryKey,
    queryFn: () =>
      kyInstance.get(`/api/posts/${postId}/bookmark`).json<BookmarkInfo>(),
    initialData: initialState,
    staleTime: Infinity,
  });

  const { mutate } = useMutation({
    mutationFn: () =>
      data.isBookmarkedByUser
        ? kyInstance.delete(`/api/posts/${postId}/bookmark`)
        : kyInstance.post(`/api/posts/${postId}/bookmark`),
    onMutate: async () => {
      toast({
        description: `投稿が${data.isBookmarkedByUser ? "ブックマーク解除" : "ブックマーク"}されました`,
      });
      await queryClient.cancelQueries({ queryKey: QueryKey });

      const previousState = queryClient.getQueryData<BookmarkInfo>(QueryKey);

      queryClient.setQueryData<BookmarkInfo>(QueryKey, () => ({
        isBookmarkedByUser: !previousState?.isBookmarkedByUser,
      }));

      return { previousState };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(QueryKey, context?.previousState);
      console.error(error);
      toast({
        variant: "destructive",
        description: "エラーが発生しました",
      });
    },
  });

  return (
    <button onClick={() => mutate()} className="flex items-center gap-2">
      <Bookmark
        className={cn(
          "size-5",
          data.isBookmarkedByUser && "fill-primary text-primary",
        )}
      />
    </button>
  );
}
