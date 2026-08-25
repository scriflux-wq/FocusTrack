import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-7 w-40" />
        <div className="flex gap-2">
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="size-9 rounded-full" />
          <Skeleton className="h-9 w-16 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-full" />
      <Skeleton className="h-[520px] w-full rounded-xl" />
    </div>
  );
}
