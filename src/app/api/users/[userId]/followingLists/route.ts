import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getUserDataSelect } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const followingUsers = await prisma.user.findMany({
      where: {
        followers: {
          some: {
            followerId: userId,
          },
        },
        ...(userId === user.id ? { id: { not: user.id } } : {}),
      },
      select: getUserDataSelect(user.id),
    });

    return Response.json(followingUsers);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
