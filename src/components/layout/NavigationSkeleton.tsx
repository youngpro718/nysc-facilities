import { Skeleton } from "@/components/ui/skeleton";

export function NavigationSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-9 rounded-md" />
      <Skeleton className="h-9 w-20" />
    </div>
  );
}

export function MobileNavigationSkeleton() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-9 rounded-md" />
    </div>
  );
}
