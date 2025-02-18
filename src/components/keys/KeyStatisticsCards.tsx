
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
      <div className="grid gap-4 md:grid-cols-4">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="bg-card">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = {
    totalKeys: keyStats?.length || 0,
    totalStock: keyStats?.reduce((acc, k) => acc + (k.total_quantity || 0), 0) || 0,
    assigned: keyStats?.reduce((acc, k) => acc + (k.active_assignments || 0), 0) || 0,
    available: keyStats?.reduce((acc, k) => acc + (k.available_quantity || 0), 0) || 0,
  };

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card className="bg-card hover:bg-card/90 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Database className="h-4 w-4" />
            Total Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalKeys}</p>
        </CardContent>
      </Card>
      <Card className="bg-card hover:bg-card/90 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package2 className="h-4 w-4" />
            Total Stock
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.totalStock}</p>
        </CardContent>
      </Card>
      <Card className="bg-card hover:bg-card/90 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4" />
            Assigned
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.assigned}</p>
        </CardContent>
      </Card>
      <Card className="bg-card hover:bg-card/90 transition-colors">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <List className="h-4 w-4" />
            Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{stats.available}</p>
        </CardContent>
      </Card>
    </div>
  );
}
