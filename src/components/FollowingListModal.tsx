"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import FollowButton from "./FollowButton";
import { UserData } from "@/lib/types";
import Image from "next/image";
import useFollowingList from "@/hooks/useFollowingList";

interface FollowingListModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FollowingListModal({
  userId,
  isOpen,
  onClose,
}: FollowingListModalProps) {
  const { data: followingList, isLoading, error } = useFollowingList(userId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>フォロー中のユーザー</DialogTitle>
        </DialogHeader>
        {isLoading && <p>読み込み中...</p>}
        {error && <p>エラーが発生しました</p>}
        {followingList && (
          <ul className="space-y-4">
            {followingList.map((user: UserData) => (
              <li key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Image
                    src={user.avatarUrl || avatarPlaceholder}
                    alt={user.displayName}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <span>{user.displayName}</span>
                </div>
                <FollowButton
                  userId={user.id}
                  initialState={{
                    followers: user._count.followers,
                    isFollowedByUser: true,
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
