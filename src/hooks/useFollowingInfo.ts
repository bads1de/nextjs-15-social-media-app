import kyInstance from "@/lib/ky";
import { FollowingInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export default function useFollowingInfo(
  userId: string,
  initialState: FollowingInfo,
) {
  const query = useQuery({
    queryKey: ["followings-info", userId],
    queryFn: () =>
      kyInstance.get(`/api/users/${userId}/followings`).json<FollowingInfo>(),
    initialData: initialState,
    staleTime: Infinity,
  });

  return query;
}
