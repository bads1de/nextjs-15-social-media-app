import { validateRequest } from "@/auth";
import FollowButton from "@/components/FollowButton";
import FollowerCount from "@/components/FollowerCount";
import TrendsSidebar from "@/components/TrendsSidebar";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/UserAvatar";
import prisma from "@/lib/prisma";
import { FollowerInfo, getUserDataSelect, UserData } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { formatDate } from "date-fns";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import UserPosts from "./UserPosts";
import Linkify from "@/components/Linkify";
import EditProfileButton from "./EditProfileButton";
import { TabsTrigger, Tabs, TabsList, TabsContent } from "@/components/ui/tabs";
import UserLikedPosts from "./UserLikedPost";

interface PageProps {
  params: {
    username: string;
  };
}

const getUser = cache(async (username: string, loggedInUserId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      username: {
        equals: username,
        mode: "insensitive",
      },
    },
    select: getUserDataSelect(loggedInUserId),
  });

  if (!user) {
    notFound();
  }

  return user;
});

export async function generateMetadata({
  params: { username },
}: PageProps): Promise<Metadata> {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) {
    return {};
  }

  const user = await getUser(username, loggedInUser.id);

  return {
    title: `${user?.displayName} (@${user?.username})`,
  };
}

export default async function Page({ params: { username } }: PageProps) {
  const { user: loggedInUser } = await validateRequest();

  if (!loggedInUser) {
    return (
      <p className="text-destructive">
        You&apos;re not authorized to view this page.
      </p>
    );
  }

  const user = await getUser(username, loggedInUser.id);

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <UserProfile user={user} loggedInUserId={loggedInUser.id} />

        <Tabs defaultValue="post">
          <TabsList>
            <TabsTrigger value="post">ポスト</TabsTrigger>
            {user.id === loggedInUser.id && (
              <TabsTrigger value="liked">いいね</TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="post">
            <div className="mt-4">
              <UserPosts userId={user.id} />
            </div>
          </TabsContent>
          {user.id === loggedInUser.id && (
            <TabsContent value="liked">
              <div className="mt-4">
                <UserLikedPosts userId={user.id} />
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      <TrendsSidebar />
    </main>
  );
}

interface UserProfileProps {
  user: UserData;
  loggedInUserId: string;
}

function UserProfile({ user, loggedInUserId }: UserProfileProps) {
  const followerInfo: FollowerInfo = {
    followers: user._count.followers,
    isFollowedByUser: user.followers.some(
      ({ followerId }) => followerId === loggedInUserId,
    ),
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl bg-card p-8 shadow-sm">
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-start">
        <UserAvatar
          avatarUrl={user.avatarUrl}
          size={150}
          className="rounded-full"
        />
        <div className="flex-grow space-y-4">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold">{user.displayName}</h1>
            <div className="text-muted-foreground">@{user.username}</div>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:justify-start">
            <div>
              投稿:{" "}
              <span className="font-semibold">
                {formatNumber(user._count.posts)}
              </span>
            </div>
            <div>
              登録日:{" "}
              <span className="font-semibold">
                {formatDate(user.createdAt, "yyyy-MM-dd")}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 sm:flex-row">
            <FollowerCount userId={user.id} initialState={followerInfo} />
            {user.id === loggedInUserId ? (
              <EditProfileButton user={user} />
            ) : (
              <FollowButton userId={user.id} initialState={followerInfo} />
            )}
          </div>
        </div>
      </div>
      {user.bio && (
        <div className="mt-8 border-t pt-6">
          <Linkify>
            <div className="whitespace-pre-line break-words">{user.bio}</div>
          </Linkify>
        </div>
      )}
    </div>
  );
}
