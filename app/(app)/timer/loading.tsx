import { Skeleton } from "@/components/ui/skeleton";

export default function TimerLoading() {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <Skeleton className="size-64 rounded-full" />
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 rounded-2xl" />
        <Skeleton className="size-14 rounded-2xl" />
        <Skeleton className="size-14 rounded-2xl" />
      </div>
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  );
}
