import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { FollowingInfo } from "@/lib/types";

export async function GET(
  request: Request,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user: loggedInUser } = await validateRequest();

    if (!loggedInUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        following: {
          where: {
            followerId: loggedInUser.id,
          },
          select: {
            followingId: true,
          },
        },
        _count: {
          select: {
            following: true,
          },
        },
      },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const data: FollowingInfo = {
      followings: user._count.following,
      isFollowingByUser: !!user.following.length,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
