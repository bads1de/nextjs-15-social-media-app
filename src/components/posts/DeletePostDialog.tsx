import { PostData } from "@/lib/types";
import LoadingButton from "../LoadingButton";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useDeletePostMutation } from "./mutations";

interface DeletePostDialogProps {
  post: PostData;
  open: boolean;
  onClose: () => void;
}

export default function DeletePostDialog({
  post,
  open,
  onClose,
}: DeletePostDialogProps) {
  const mutation = useDeletePostMutation(post);

  const handleOpenChange = (open: boolean) => {
    if (!open || mutation.isPending) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>投稿を削除しますか？</DialogTitle>
          <DialogDescription>この操作は元に戻せません。</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <LoadingButton
            variant="destructive"
            onClick={() => mutation.mutate(post.id, { onSuccess: onClose })}
            loading={mutation.isPending}
          >
            削除
          </LoadingButton>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            キャンセル
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
