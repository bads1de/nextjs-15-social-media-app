import { UserData } from "@/lib/types";
import kyInstance from "@/lib/ky";
import { useQuery } from "@tanstack/react-query";

export default function useFollowingList(userId: string) {
  return useQuery<UserData[]>({
    queryKey: ["following-list", userId],
    queryFn: () => kyInstance.get(`/api/users/${userId}/followingLists`).json(),
  });
}
