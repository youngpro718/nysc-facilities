
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Package2, Users, List } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { KeyData } from "./types/KeyTypes";

interface KeyStatisticsCardsProps {
  keyStats: KeyData[] | undefined;
  isLoading: boolean;
}

export function KeyStatisticsCards({ keyStats, isLoading }: KeyStatisticsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="bg-card">
            <CardHeader className="pb-2 p-3 sm:p-4">
              <Skeleton className="h-3 sm:h-4 w-20 sm:w-24" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <Skeleton className="h-6 sm:h-8 w-12 sm:w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = {
    totalKeys: keyStats?.length || 0,
    totalStock: keyStats?.reduce((acc, k) => acc + (k.total_quantity || 0), 0) || 0,
    assigned: keyStats?.reduce((acc, k) => acc + (k.assigned_count || k.active_assignments || 0), 0) || 0,
    available: keyStats?.reduce((acc, k) => acc + (k.available_quantity || 0), 0) || 0,
  };

  return (
    <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
      <Card className="bg-card hover:bg-card/90 transition-colors">
        <CardHeader className="pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
            <Database className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">Total Keys</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-xl sm:text-2xl font-bold">{stats.totalKeys}</p>
        </CardContent>
      </Card>
      <Card className="bg-card hover:bg-card/90 transition-colors">
        <CardHeader className="pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
            <Package2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">Total Stock</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-xl sm:text-2xl font-bold">{stats.totalStock}</p>
        </CardContent>
      </Card>
      <Card className="bg-card hover:bg-card/90 transition-colors">
        <CardHeader className="pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">Assigned</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-xl sm:text-2xl font-bold">{stats.assigned}</p>
        </CardContent>
      </Card>
      <Card className="bg-card hover:bg-card/90 transition-colors">
        <CardHeader className="pb-2 p-3 sm:p-4">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2">
            <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="truncate">Available</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 pt-0">
          <p className="text-xl sm:text-2xl font-bold">{stats.available}</p>
        </CardContent>
      </Card>
    </div>
  );
}
