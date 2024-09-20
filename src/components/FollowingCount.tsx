"use client";

import useFollowingInfo from "@/hooks/useFollowingInfo";
import { FollowingInfo } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

interface FollowingCountProps {
  userId: string;
  initialState: FollowingInfo;
}

export default function FollowingCount({
  userId,
  initialState,
}: FollowingCountProps) {
  const { data } = useFollowingInfo(userId, initialState);

  return (
    <span className="text-sm text-slate-500">
      フォロー中:{" "}
      <span className="font-semibold">{formatNumber(data.followings)}</span>
    </span>
  );
}
