import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const BuildingCardSkeleton = () => (
  <Card className="overflow-hidden">
    <div className="aspect-video">
      <Skeleton className="h-full w-full" />
    </div>
    <CardHeader className="space-y-2">
      <Skeleton className="h-5 w-24" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    </CardContent>
  </Card>
);