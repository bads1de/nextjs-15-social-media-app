"use client";

import useFollowingInfo from "@/hooks/useFollowingInfo";
import { FollowingInfo } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { useState } from "react";
import { FollowingListModal } from "./FollowingListModal";

interface FollowingCountProps {
  userId: string;
  initialState: FollowingInfo;
}

export default function FollowingCount({
  userId,
  initialState,
}: FollowingCountProps) {
  const { data } = useFollowingInfo(userId, initialState);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="text-sm text-slate-500 hover:underline"
      >
        フォロー中:{" "}
        <span className="font-semibold">{formatNumber(data.followings)}</span>
      </button>
      <FollowingListModal
        userId={userId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
