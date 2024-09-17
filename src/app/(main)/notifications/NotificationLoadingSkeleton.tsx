import { Skeleton } from "@/components/ui/skeleton";

export default function NotificationLoadingSkeleton() {
  return (
    <div className="space-y-5">
      <NotificationSkeleton />
      <NotificationSkeleton />
      <NotificationSkeleton />
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="w-full animate-pulse space-y-3 rounded-2xl bg-card p-5 shadow-sm">
      <div className="flex gap-3">
        <Skeleton className="size-7 rounded-full" />
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-3">
            <Skeleton className="size-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
          </div>
          <Skeleton className="h-8 rounded" />
        </div>
      </div>
    </div>
  );
}
