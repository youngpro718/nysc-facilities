import { useState } from "react";
import { logger } from '@/lib/logger';
import { Package, RefreshCw, WifiOff, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@features/auth/hooks/useAuth";
import { useSupplyRequests } from "@features/supply/hooks/useSupplyRequests";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnhancedSupplyTracker } from "@shared/components/user/EnhancedSupplyTracker";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@shared/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { SupplyRequestErrorBoundary } from "@features/supply/components/supply/SupplyRequestErrorBoundary";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/layout/Breadcrumb";
import { getErrorMessage } from "@/lib/errorUtils";

// Simplified filter groups
const FILTER_GROUPS: Record<string, string[]> = {
  all: [],
  active: ['submitted', 'pending_approval', 'approved', 'received', 'picking', 'packing'],
  ready: ['ready'],
  completed: ['completed', 'fulfilled', 'rejected', 'cancelled'],
};

export default function MySupplyRequests() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: requests = [], isLoading, refetch, isFetching, error, isError } = useSupplyRequests(user?.id);

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Refreshed successfully");
    } catch (err) {
      toast.error("Failed to refresh. Please try again.");
      logger.error("Refresh error:", err);
    }
  };

  const handleRetry = async () => {
    try { await refetch(); } catch (err) { logger.error("Retry error:", err); }
  };

  // Filter using simplified groups
  const filteredRequests = requests.filter(request => {
    if (statusFilter === "all") return true;
    const group = FILTER_GROUPS[statusFilter];
    return group ? group.includes(request.status) : request.status === statusFilter;
  });

  if (isLoading) {
    return (
      <PageContainer>
        <Breadcrumb />
        <PageHeader title="My Supply Requests" description="Track your supply requests" />
        <SkeletonList count={3} variant="detailed" />
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer>
        <Breadcrumb />
        <PageHeader title="My Supply Requests" description="Track your supply requests" />
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center text-center py-12 px-4">
            <WifiOff className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-base font-medium mb-2">Unable to load requests</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {getErrorMessage(error) || "There was a problem loading your supply requests."}
            </p>
            <Button onClick={handleRetry} disabled={isFetching} className="touch-target">
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <SupplyRequestErrorBoundary onReset={handleRetry}>
    <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
      <PageContainer>
        <Breadcrumb />
        <PageHeader
          title="My Supply Requests" 
          description="Track and manage your supply requests"
        >
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-28 sm:w-32 touch-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => refetch()}
              disabled={isFetching}
              className="touch-target h-10 w-10 flex-shrink-0"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>

            <Button
              onClick={() => navigate('/request/supplies')}
              className="flex-1 sm:flex-none touch-target min-h-[44px] active:scale-95 transition-transform"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Order Supplies
            </Button>
          </div>
        </PageHeader>

        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center text-center py-12 px-4">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-base font-medium mb-2">
                {statusFilter === "all" ? "No supply requests yet" : `No ${statusFilter} requests`}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {statusFilter === "all" 
                  ? "Get started by ordering your first supplies." 
                  : `You don't have any ${statusFilter} requests right now.`}
              </p>
              {statusFilter === "all" && (
                <Button 
                  onClick={() => navigate('/request/supplies')} 
                  className="touch-target min-h-[44px]"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Order Supplies
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <EnhancedSupplyTracker 
            requests={filteredRequests}
            featured={false}
          />
        )}
      </PageContainer>
    </PullToRefresh>
    </SupplyRequestErrorBoundary>
  );
}
