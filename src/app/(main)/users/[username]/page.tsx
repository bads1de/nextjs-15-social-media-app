import { validateRequest } from "@/auth";
import FollowButton from "@/components/FollowButton";
import FollowerCount from "@/components/FollowerCount";
import TrendsSidebar from "@/components/TrendsSidebar";
import UserAvatar from "@/components/UserAvatar";
import prisma from "@/lib/prisma";
import {
  FollowerInfo,
  FollowingInfo,
  getUserDataSelect,
  UserData,
} from "@/lib/types";
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
import FollowingCount from "@/components/FollowingCount";

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

  const followingInfo: FollowingInfo = {
    followings: user._count.following,
    isFollowingByUser: user.following.some(
      (follow) => follow.followingId === loggedInUserId,
    ),
  };

  return (
    <div className="relative mx-auto max-w-2xl rounded-lg bg-card p-8 shadow-md">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
        <div className="relative">
          <UserAvatar
            avatarUrl={user.avatarUrl}
            size={150}
            className="rounded-full border-4 border-gray-200"
          />
          {user.id === loggedInUserId && (
            <div className="absolute bottom-0 right-0">
              <EditProfileButton user={user} />
            </div>
          )}
        </div>
        <div className="flex-grow space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">{user.displayName}</h1>
              <div className="text-gray-600">@{user.username}</div>
            </div>
            {user.id !== loggedInUserId && (
              <FollowButton userId={user.id} initialState={followerInfo} />
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-gray-600">
            <div>
              <span className="font-medium">投稿:</span>{" "}
              {formatNumber(user._count.posts)}
            </div>
            <div>
              <span className="font-medium">登録日:</span>{" "}
              {formatDate(user.createdAt, "yyyy-MM-dd")}
            </div>
          </div>
          <div className="flex gap-3">
            <FollowingCount userId={user.id} initialState={followingInfo} />
            <FollowerCount userId={user.id} initialState={followerInfo} />
          </div>
          {user.bio && (
            <div className="mt-4 border-t pt-4 text-gray-700">
              <Linkify>
                <div className="whitespace-pre-line break-words">
                  {user.bio}
                </div>
              </Linkify>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
