import kyInstance from "@/lib/ky";
import { FollowingsInfo } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

export default function useFollowingInfo(
  userId: string,
  initialState: FollowingsInfo,
) {
  const query = useQuery({
    queryKey: ["followings-info", userId],
    queryFn: () =>
      kyInstance.get(`/api/users/${userId}/followings`).json<FollowingsInfo>(),
    initialData: initialState,
    staleTime: Infinity,
  });

  return query;
}
