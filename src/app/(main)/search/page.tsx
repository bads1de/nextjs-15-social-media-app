import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import SearchResults from "./SearchResults";

interface PageProps {
  searchParams: {
    q: string;
  };
}

export function generateMetadata({ searchParams: { q } }: PageProps): Metadata {
  return {
    title: q ? `「${q}」の検索結果` : "検索",
  };
}

export default function Page({ searchParams: { q } }: PageProps) {
  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="line-clamp-2 break-all text-center text-2xl font-bold">
            「{q}」の検索結果
          </h1>
        </div>
        <SearchResults query={q} />
      </div>
      <TrendsSidebar />
    </main>
  );
}
