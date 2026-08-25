import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizeLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-7 w-32" />
      <Skeleton className="h-10 w-64 rounded-lg" />
      <Skeleton className="h-9 w-40 rounded-lg" />
      <Skeleton className="h-56 w-full rounded-xl" />
    </div>
  );
}
