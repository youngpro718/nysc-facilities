import { Skeleton } from "@/components/ui/skeleton";

export const BuildingCardSkeleton = () => (
  <div className="overflow-hidden rounded-md border bg-card">
    <div className="flex min-h-[72px] items-center justify-between border-b px-5 py-3.5">
      <div className="space-y-2">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="h-4 w-20" />
    </div>
    <Skeleton className="h-[230px] w-full rounded-none sm:h-[260px]" />
    <div className="grid grid-cols-3 divide-x border-t">
      {[1, 2, 3].map((item) => (
        <div key={item} className="space-y-2 px-4 py-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-10" />
        </div>
      ))}
    </div>
  </div>
);
