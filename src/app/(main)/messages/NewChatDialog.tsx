import LoadingButton from "@/components/LoadingButton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import UserAvatar from "@/components/UserAvatar";
import useDebounce from "@/hooks/useDebounce";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Check, Loader2, SearchIcon, X } from "lucide-react";
import { useState } from "react";
import { UserResponse } from "stream-chat";
import { DefaultStreamChatGenerics, useChatContext } from "stream-chat-react";
import { useSession } from "../SessionProvider";

interface NewChatDialogProps {
  onOpenChange: (open: boolean) => void;
  onChatCreated: () => void;
}

export default function NewChatDialog({
  onOpenChange,
  onChatCreated,
}: NewChatDialogProps) {
  const { client, setActiveChannel } = useChatContext();

  const { toast } = useToast();

  const { user: loggedInUser } = useSession();

  const [searchInput, setSearchInput] = useState("");
  const searchInputDebounced = useDebounce(searchInput);

  const [selectedUsers, setSelectedUsers] = useState<
    UserResponse<DefaultStreamChatGenerics>[]
  >([]);

  /**
   * Stream Chatのユーザーを検索するためのクエリ。
   *
   * - ログイン中のユーザー自身を除外
   * - 管理者ロールのユーザーを除外
   * - 検索入力がある場合は、名前またはユーザー名でオートコンプリート検索
   * - 検索結果の上限は15件
   */
  const { data, isFetching, isError, isSuccess } = useQuery({
    queryKey: ["stream-users", searchInputDebounced], // クエリキー：stream-usersとデバウンスされた検索入力
    queryFn: async () => {
      // Stream Chatのクエリユーザー関数を使用してユーザーを検索
      return client.queryUsers(
        {
          // ログイン中のユーザー自身を除外
          id: { $ne: loggedInUser?.id },
          // 管理者ロールのユーザーを除外
          role: { $ne: "admin" },
          // 検索入力がある場合のみ、オートコンプリート検索条件を追加
          ...(searchInputDebounced
            ? {
                $or: [
                  // 名前でオートコンプリート検索
                  { name: { $autocomplete: searchInputDebounced } },
                  // ユーザー名でオートコンプリート検索
                  { username: { $autocomplete: searchInputDebounced } },
                ],
              }
            : {}),
        },
        // 返却するユーザー情報のフィールドを指定
        { name: 1, username: 1 },
        // 検索結果の上限を15件に設定
        { limit: 15 },
      );
    },
  });

  /**
   * 新しいチャットを作成するためのMutation。
   *
   * - `mutationFn`: 新しいチャットを作成する非同期関数。
   *   - ログイン中のユーザーと選択されたユーザーを含むメンバーでチャットを作成します。
   *   - 選択されたユーザーが複数いる場合は、チャット名にユーザー名を追加します。
   *   - チャットを作成し、作成されたチャットを返します。
   * - `onSuccess`: チャットの作成に成功した場合に実行される関数。
   *   - 作成されたチャットをアクティブチャネルに設定します。
   *   - `onChatCreated` コールバックを実行します。
   * - `onError`: チャットの作成に失敗した場合に実行される関数。
   *   - エラートーストを表示します。
   */
  const mutation = useMutation({
    mutationFn: async () => {
      // チャネルを作成します。
      const channel = client.channel("messaging", {
        // メンバーはログインユーザーと選択されたユーザーです。
        members: [loggedInUser.id, ...selectedUsers.map((u) => u.id)],
        // 選択されたユーザーが複数の場合、チャネル名にユーザー名を追加します。
        name:
          selectedUsers.length > 1
            ? loggedInUser.displayName +
              ", " +
              selectedUsers.map((u) => u.name).join(", ")
            : undefined,
      });
      await channel.create();
      return channel;
    },
    onSuccess: (channel) => {
      // 作成されたチャットをアクティブチャネルに設定
      setActiveChannel(channel);
      // チャット作成完了コールバックを実行
      onChatCreated();
    },
    onError: (error) => {
      console.error("Failed to create chat", error);
      toast({
        title: "チャットの作成に失敗しました",
        description: "お手数をおかけしますが、もう一度お試しください",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="bg-card p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>新規チャット</DialogTitle>
        </DialogHeader>
        <div>
          <div className="group relative">
            <SearchIcon className="absolute left-5 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground group-focus-within:text-primary" />
            <input
              placeholder="ユーザーを検索..."
              className="h-12 w-full pe-4 ps-14 focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          {!!selectedUsers.length && (
            <div className="mt-4 flex flex-wrap gap-2 p-2">
              {selectedUsers.map((user) => (
                <SelectedUserTag
                  key={user.id}
                  user={user}
                  onRemove={() => {
                    setSelectedUsers((prev) =>
                      prev.filter((u) => u.id !== user.id),
                    );
                  }}
                />
              ))}
            </div>
          )}
          <hr />
          <div className="h-96 overflow-y-auto">
            {isSuccess &&
              data.users.map((user) => (
                <UserResult
                  key={user.id}
                  user={user}
                  selected={selectedUsers.some((u) => u.id === user.id)}
                  onClick={() => {
                    setSelectedUsers((prev) => {
                      // クリックされたユーザーが既に選択されているかどうかを確認します。
                      const isUserSelected = prev.some((u) => u.id === user.id);
                      // 既に選択されている場合は、選択済みユーザーの配列から削除します。
                      if (isUserSelected) {
                        return prev.filter((u) => u.id !== user.id);
                      } else {
                        // 選択されていない場合は、選択済みユーザーの配列に追加します。
                        return [...prev, user];
                      }
                    });
                  }}
                />
              ))}
            {isSuccess && !data.users.length && (
              <p className="my-3 text-center text-muted-foreground">
                ユーザーが見つかりませんでした。別の名前を試してください。
              </p>
            )}
            {isFetching && <Loader2 className="mx-auto my-3 animate-spin" />}
            {isError && (
              <p className="my-3 text-center text-destructive">
                ユーザーの読み込み中にエラーが発生しました。
              </p>
            )}
          </div>
        </div>
        <DialogFooter className="px-6 pb-6">
          <LoadingButton
            disabled={!selectedUsers.length}
            loading={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            チャット開始
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface UserResultProps {
  user: UserResponse<DefaultStreamChatGenerics>;
  selected: boolean;
  onClick: () => void;
}

function UserResult({ user, selected, onClick }: UserResultProps) {
  return (
    <button
      className="flex w-full items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/50"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <UserAvatar avatarUrl={user.image} />
        <div className="flex flex-col text-start">
          <p className="font-bold">{user.name}</p>
          <p className="text-muted-foreground">@{user.username}</p>
        </div>
      </div>

      {selected && <Check className="size-5 text-green-500" />}
    </button>
  );
}

interface selectedUserTagProps {
  user: UserResponse<DefaultStreamChatGenerics>;
  onRemove: () => void;
}

function SelectedUserTag({ user, onRemove }: selectedUserTagProps) {
  return (
    <button
      onClick={onRemove}
      className="gap2 flex items-center rounded-full border p-1 hover:bg-muted/50"
    >
      <UserAvatar avatarUrl={user.image} />
      <p className="font-bold">{user.name}</p>
      <X className="size-5 text-muted-foreground" />
    </button>
  );
}
