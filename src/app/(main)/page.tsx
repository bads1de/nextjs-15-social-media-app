import PostEditor from "@/components/posts/editor/PostEditor";
import TrendsSidebar from "@/components/TrendsSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FollowingFeed from "./FollowingFeed";
import ForYouFeed from "./ForYouFeed";
import ShortVideoGallery from "@/components/shorts/ShortVideoGallery";

const sampleVideos = [
  { videoUrl: "/video1.mp4", title: "Video 1" },
  { videoUrl: "/video2.mp4", title: "Video 2" },
  { videoUrl: "/video3.mp4", title: "Video 3" },
];

export default async function Home() {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <PostEditor />
        {/* <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="text-center text-2xl font-bold">Short Vibes!</h1>
        </div>
        <ShortVideoGallery videos={sampleVideos} /> */}
        <Tabs defaultValue="for-you">
          <TabsList>
            <TabsTrigger value="for-you">おすすめ</TabsTrigger>
            <TabsTrigger value="following">フォロー中</TabsTrigger>
          </TabsList>
          <TabsContent value="for-you">
            <ForYouFeed />
          </TabsContent>
          <TabsContent value="following">
            <FollowingFeed />
          </TabsContent>
        </Tabs>
      </div>
      <TrendsSidebar />
    </main>
  );
}
