import { UserData } from "@/lib/types";
import kyInstance from "@/lib/ky";
import { useQuery } from "@tanstack/react-query";

export function useFollowerList(userId: string) {
  return useQuery<UserData[]>({
    queryKey: ["follower-list", userId],
    queryFn: () => kyInstance.get(`/api/users/${userId}/followerLists`).json(),
  });
}
