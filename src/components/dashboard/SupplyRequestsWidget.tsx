import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SupplyRequestStats {
  pending: number;
  under_review: number;
  approved: number;
  total: number;
}

export function SupplyRequestsWidget() {
  const navigate = useNavigate();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['supply-request-stats'],
    queryFn: async (): Promise<SupplyRequestStats> => {
      const { data, error } = await supabase
        .from('supply_requests')
        .select('status');

      if (error) throw error;

      const stats = data.reduce((acc, request) => {
        acc.total++;
        acc[request.status as keyof SupplyRequestStats]++;
        return acc;
      }, {
        pending: 0,
        under_review: 0,
        approved: 0,
        total: 0
      });

      return stats;
    },
  });

  const getUrgencyColor = (count: number) => {
    if (count === 0) return "secondary";
    if (count < 3) return "default";
    if (count < 6) return "destructive";
    return "destructive";
  };

  return (
    <Card className="col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Package className="h-4 w-4" />
          Supply Requests
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/admin/supply-requests')}
        >
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded animate-pulse" />
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">Pending</span>
              </div>
              <Badge variant={getUrgencyColor(stats?.pending || 0)}>
                {stats?.pending || 0}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Under Review</span>
              </div>
              <Badge variant={getUrgencyColor(stats?.under_review || 0)}>
                {stats?.under_review || 0}
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Approved</span>
              </div>
              <Badge variant="secondary">
                {stats?.approved || 0}
              </Badge>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Total Requests</span>
                <span>{stats?.total || 0}</span>
              </div>
            </div>

            {(stats?.pending || 0) > 0 && (
              <div className="pt-2">
                <Button
                  variant="default"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/admin/supply-requests')}
                >
                  Review Pending Requests
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}