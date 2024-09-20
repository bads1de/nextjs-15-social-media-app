"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { useFollowerList } from "@/hooks/useFollowerList";
import avatarPlaceholder from "@/assets/avatar-placeholder.png";
import FollowButton from "./FollowButton";
import { UserData } from "@/lib/types";
import Image from "next/image";

interface FollowerListModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FollowerListModal({
  userId,
  isOpen,
  onClose,
}: FollowerListModalProps) {
  const { data: followerList, isLoading, error } = useFollowerList(userId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>フォロワー</DialogTitle>
        </DialogHeader>
        {isLoading && <p>読み込み中...</p>}
        {error && <p>エラーが発生しました</p>}
        {followerList && (
          <ul className="space-y-4">
            {followerList.map((user: UserData) => (
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
                    isFollowedByUser: user.followers.length > 0,
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
