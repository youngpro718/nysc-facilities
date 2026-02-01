import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, Package, Truck, Key, Eye, Filter } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useKeyRequests } from "@/hooks/useKeyRequests";
import { useKeyOrders } from "@/hooks/useKeyOrders";
import { useRequestActions } from "@/hooks/useRequestActions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { KeyRequestForm } from "@/components/requests/KeyRequestForm";
import { MobileRequestCard } from "@/components/requests/mobile/MobileRequestCard";
import { MobileRequestForm } from "@/components/mobile/MobileRequestForm";
import { RequestDetailsModal } from "@/components/requests/RequestDetailsModal";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { SkeletonList } from "@/components/ui/SkeletonCard";
import { PullToRefresh } from "@/components/ui/PullToRefresh";
import { useIsMobile } from "@/hooks/use-mobile";
import { Breadcrumb } from "@/components/layout/Breadcrumb";

const statusConfig = {
  pending: { 
    icon: Clock, 
    color: "bg-yellow-500", 
    label: "Pending Review",
    variant: "secondary" as const,
    description: "Waiting for administrator approval"
  },
  approved: { 
    icon: CheckCircle, 
    color: "bg-green-500", 
    label: "Approved",
    variant: "default" as const,
    description: "Request approved, processing order"
  },
  rejected: { 
    icon: XCircle, 
    color: "bg-red-500", 
    label: "Rejected",
    variant: "destructive" as const,
    description: "Request was denied"
  },
  fulfilled: { 
    icon: CheckCircle, 
    color: "bg-blue-500", 
    label: "Fulfilled",
    variant: "outline" as const,
    description: "Key is ready for pickup"
  }
};

const orderStatusConfig = {
  pending_fulfillment: { icon: Clock, label: "Pending Fulfillment", progress: 10 },
  in_progress: { icon: Package, label: "In Progress", progress: 40 },
  received: { icon: Truck, label: "Received", progress: 75 },
  ready_for_pickup: { icon: Key, label: "Ready for Pickup", progress: 100 },
  completed: { icon: CheckCircle, label: "Completed", progress: 100 },
  cancelled: { icon: XCircle, label: "Cancelled", progress: 0 },
};

const normalizeOrderStatus = (status?: string) => {
  switch (status) {
    case 'ordered':
    case 'in_transit':
      return 'in_progress';
    case 'delivered':
      return 'completed';
    case 'partially_received':
      return 'received';
    default:
      return (status || '') as keyof typeof orderStatusConfig;
  }
};

const getRequestTypeLabel = (type: string) => {
  switch (type) {
    case 'spare': return 'Spare Key';
    case 'replacement': return 'Replacement Key';
    case 'new': return 'New Access';
    default: return type;
  }
};

export default function MyRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: requests = [], isLoading, refetch } = useKeyRequests(user?.id);
  const { data: orders = [] } = useKeyOrders(user?.id);
  const { cancelRequest, isCancelling } = useRequestActions();

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileDevice(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-open form if ?new=1 in URL
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      if (isMobileDevice) {
        setShowMobileForm(true);
      } else {
        setShowRequestForm(true);
      }
      // Clean the URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, isMobileDevice]);

  // Handle refresh for pull-to-refresh
  const handleRefresh = async () => {
    await refetch();
  };

  // Filter requests based on status
  const filteredRequests = requests.filter(request => 
    statusFilter === "all" || request.status === statusFilter
  );

  const handleSubmitRequest = async (data: any) => {
    setShowRequestForm(false);
    setShowMobileForm(false);
    try {
      // Using direct supabase call instead
      
      const { error } = await supabase.from('key_requests').insert({
        reason: data.reason,
        user_id: user!.id,
        request_type: data.request_type,
        room_id: data.room_id || null,
        room_other: data.room_other || null,
        quantity: data.quantity,
        emergency_contact: data.emergency_contact || null,
        email_notifications_enabled: data.email_notifications_enabled,
      });
      
      toast.success('Key request submitted successfully!');
      refetch();
    } catch (error) {
      toast.error('Failed to submit key request.');
    }
  };

  const handleCancelRequest = (requestId: string) => {
    cancelRequest(requestId);
    setSelectedRequest(null);
  };

  const handleViewDetails = (request: any) => {
    setSelectedRequest(request);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Requests" description="Track your key requests" />
        <SkeletonList count={3} variant="detailed" />
      </PageContainer>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} enabled={isMobile}>
      <PageContainer>
      <Breadcrumb />
      <PageHeader
        title="My Key Requests" 
        description="Track and manage your key requests"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32 touch-target">
              <Filter className="h-4 w-4 mr-2 flex-shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="fulfilled">Fulfilled</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => isMobileDevice ? setShowMobileForm(true) : setShowRequestForm(true)} className="w-full sm:w-auto touch-target">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">New Request</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      </PageHeader>

      <KeyRequestForm 
        open={showRequestForm}
        onClose={() => setShowRequestForm(false)}
        onSubmit={handleSubmitRequest}
      />

      <MobileRequestForm 
        open={showMobileForm}
        onClose={() => setShowMobileForm(false)}
        onSubmit={handleSubmitRequest}
        type="key_request"
      />

      <RequestDetailsModal
        request={selectedRequest}
        order={selectedRequest ? orders.find(order => 
          order.notes?.includes(selectedRequest.id) || 
          (order.ordered_at && new Date(order.ordered_at) >= new Date(selectedRequest.created_at || ''))
        ) : undefined}
        open={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onCancel={selectedRequest?.status === 'pending' ? () => handleCancelRequest(selectedRequest.id) : undefined}
      />

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center text-center py-12 px-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-base sm:text-lg font-medium mb-2">
              {statusFilter === "all" ? "No requests yet" : `No ${statusFilter} requests`}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {statusFilter === "all" 
                ? "Get started by creating your first request." 
                : `You don't have any ${statusFilter} requests at the moment.`}
            </p>
            {statusFilter === "all" && (
              <Button onClick={() => isMobileDevice ? setShowMobileForm(true) : setShowRequestForm(true)} className="touch-target">
                <Plus className="h-4 w-4 mr-2" />
                Create First Request
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {isMobileDevice ? (
            // Mobile view with enhanced cards
            filteredRequests.map((request) => (
              <MobileRequestCard
                key={request.id}
                request={request}
                onViewDetails={() => handleViewDetails(request)}
                onCancel={request.status === 'pending' ? () => handleCancelRequest(request.id) : undefined}
                onFollowUp={() => {/* Handle follow up */}}
                onResubmit={() => {/* Handle resubmit */}}
              />
            ))
          ) : (
            // Desktop view
            filteredRequests.map((request) => {
              const requestStatus = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = requestStatus.icon;
              
              // Find related key order
              const relatedOrder = orders.find(order => 
                order.notes?.includes(request.id) || 
                (order.ordered_at && new Date(order.ordered_at) >= new Date(request.created_at || ''))
              );
              
              return (
                <Card key={request.id} className="transition-all duration-200 hover:shadow-md active:scale-[0.99]">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <StatusIcon className="h-5 w-5" />
                          {getRequestTypeLabel(request.request_type || 'key')} Request
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {requestStatus.description}
                        </p>
                      </div>
                      <Badge variant={requestStatus.variant}>
                        {requestStatus.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">Reason</p>
                        <p className="text-sm">{request.reason || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">Quantity</p>
                        <p className="text-sm">{request.quantity || 1} key(s)</p>
                      </div>
                    </div>

                    {request.room_other && (
                      <div>
                        <p className="font-medium text-sm text-muted-foreground mb-1">Room/Location</p>
                        <p className="text-sm">{request.room_other}</p>
                      </div>
                    )}

                    {request.admin_notes && (
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="font-medium text-sm text-muted-foreground mb-1">
                          {request.status === 'rejected' ? 'Rejection Reason' : 'Admin Notes'}
                        </p>
                        <p className="text-sm">{request.admin_notes}</p>
                      </div>
                    )}

                    {/* Order Tracking for Approved Requests */}
                    {request.status === 'approved' && relatedOrder && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">Order Progress</p>
                          {(() => {
                            const normalized = normalizeOrderStatus(relatedOrder.status);
                            return (
                              <span className="text-sm text-muted-foreground">
                                {orderStatusConfig[normalized as keyof typeof orderStatusConfig]?.label || normalized}
                              </span>
                            );
                          })()}
                        </div>
                        {(() => {
                          const normalized = normalizeOrderStatus(relatedOrder.status);
                          return (
                            <Progress 
                              value={orderStatusConfig[normalized as keyof typeof orderStatusConfig]?.progress || 0} 
                              className="h-2"
                            />
                          );
                        })()}
                        {normalizeOrderStatus(relatedOrder.status) === 'ready_for_pickup' && (
                          <p className="text-sm text-green-600 mt-2 font-medium">
                            🎉 Your key is ready for pickup at the facilities office!
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                      <span>Submitted: {request.created_at ? format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a") : 'Unknown'}</span>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewDetails(request)}
                          className="touch-target active:scale-95 transition-transform"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        {request.status === 'pending' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleCancelRequest(request.id)}
                            disabled={isCancelling}
                            className="touch-target active:scale-95 transition-transform"
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
      </PageContainer>
    </PullToRefresh>
  );
}
