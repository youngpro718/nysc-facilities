import { useState } from "react";
import { Package, Plus, Filter, RefreshCw, AlertCircle, WifiOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSupplyRequests } from "@/hooks/useSupplyRequests";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { EnhancedSupplyTracker } from "@/components/user/EnhancedSupplyTracker";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QuickOrderGrid } from "@/components/supply/QuickOrderGrid";
import { Card, CardContent } from "@/components/ui/card";
import { SupplyRequestErrorBoundary } from "@/components/supply/SupplyRequestErrorBoundary";
import { toast } from "sonner";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

export default function MySupplyRequests() {
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: requests = [], isLoading, refetch, isFetching, error, isError } = useSupplyRequests(user?.id);

  // Handle refresh for pull-to-refresh with error handling
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("Refreshed successfully");
    } catch (err) {
      toast.error("Failed to refresh. Please try again.");
      console.error("Refresh error:", err);
    }
  };

  // Handle manual retry
  const handleRetry = async () => {
    try {
      await refetch();
    } catch (err) {
      console.error("Retry error:", err);
    }
  };

  // Filter requests based on status
  const filteredRequests = requests.filter(request => 
    statusFilter === "all" || request.status === statusFilter
  );

  if (isLoading) {
    return (
      <PageContainer>
        <Breadcrumb />
        <PageHeader title="My Supply Requests" description="Track your supply requests" />
        <SkeletonList count={3} variant="detailed" />
      </PageContainer>
    );
  }

  // Error state with retry
  if (isError) {
    return (
      <PageContainer>
        <Breadcrumb />
        <PageHeader title="My Supply Requests" description="Track your supply requests" />
        <Card className="border-destructive/50">
          <CardContent className="flex flex-col items-center text-center py-12 px-4">
            <WifiOff className="h-12 w-12 text-destructive mb-4" />
            <h3 className="text-base sm:text-lg font-medium mb-2">
              Unable to load requests
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {error instanceof Error 
                ? error.message 
                : "There was a problem loading your supply requests. Please check your connection and try again."}
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 touch-target">
                <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="picking">Picking</SelectItem>
                <SelectItem value="packing">Packing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetch()}
              disabled={isFetching}
              className="w-full sm:w-auto touch-target min-h-[44px] active:scale-95 transition-transform"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-2">Refresh</span>
            </Button>

            <Dialog open={showNewRequestForm} onOpenChange={setShowNewRequestForm}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto touch-target min-h-[44px] active:scale-95 transition-transform">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">New Request</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Quick Order Supplies</DialogTitle>
                </DialogHeader>
                <QuickOrderGrid />
              </DialogContent>
            </Dialog>
          </div>
        </PageHeader>

        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center text-center py-12 px-4">
              <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-base sm:text-lg font-medium mb-2">
                {statusFilter === "all" ? "No supply requests yet" : `No ${statusFilter} requests`}
              </h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {statusFilter === "all" 
                  ? "Get started by creating your first supply request." 
                  : `You don't have any ${statusFilter} supply requests at the moment.`}
              </p>
              {statusFilter === "all" && (
                <Button 
                  onClick={() => setShowNewRequestForm(true)} 
                  className="touch-target min-h-[44px] active:scale-95 transition-transform"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Request
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
