import { validateRequest } from "@/auth";
import prisma from "@/lib/prisma";
import { getPostDataInclude, PostsPage } from "@/lib/types";
import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params: { userId } }: { params: { userId: string } },
) {
  try {
    const cursor = req.nextUrl.searchParams.get("cursor") || undefined;
    const pageSize = 10;

    const { user } = await validateRequest();

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.id !== userId) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const likedPosts = await prisma.like.findMany({
      where: { userId },
      include: {
        post: {
          include: getPostDataInclude(user.id),
        },
      },
      orderBy: { post: { createdAt: "desc" } },
      take: pageSize + 1,
      cursor: cursor
        ? { userId_postId: { userId, postId: cursor } }
        : undefined,
    });

    const posts = likedPosts.map((like) => like.post);
    const nextCursor = posts.length > pageSize ? posts[pageSize].id : null;

    const data: PostsPage = {
      posts: posts.slice(0, pageSize),
      nextCursor,
    };

    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
