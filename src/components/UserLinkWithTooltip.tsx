"use client";

import kyInstance from "@/lib/ky";
import { UserData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { HTTPError } from "ky";
import Link from "next/link";
import { PropsWithChildren } from "react";
import UserTooltip from "./UserTooltip";

interface UserLinkWithTooltipProps extends PropsWithChildren {
  username: string;
}

export default function UserLinkWithTooltip({
  username,
  children,
}: UserLinkWithTooltipProps) {
  const { data } = useQuery({
    queryKey: ["user-data", username],
    // クエリ関数で、ユーザーデータを取得するAPIを呼び出します。
    queryFn: () =>
      kyInstance.get(`/api/users/username/${username}`).json<UserData>(),
    // エラーが発生した場合のリトライ処理を定義します。
    retry(failureCount, error) {
      // HTTPErrorが発生し、ステータスコードが404の場合はリトライしません。
      if (error instanceof HTTPError && error.response.status === 404) {
        return false;
      }
      // それ以外の場合は、3回までリトライします。
      return failureCount < 3;
    },
    // データの有効期限を無限に設定します。
    staleTime: Infinity,
  });

  if (!data) {
    return (
      <Link
        href={`/users/${username}`}
        className="text-primary hover:underline"
      >
        {children}
      </Link>
    );
  }

  return (
    <UserTooltip user={data}>
      <Link
        href={`/users/${data.username}`}
        className="text-primary hover:underline"
      >
        {children}
      </Link>
    </UserTooltip>
  );
}
