import { useState, useEffect } from "react";
import { Plus, Clock, CheckCircle, XCircle, AlertCircle, Package, Truck, Key } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useKeyRequests } from "@/hooks/useKeyRequests";
import { useKeyOrders } from "@/hooks/useKeyOrders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/layout/PageHeader";
import { KeyRequestForm } from "@/components/requests/KeyRequestForm";
import { MobileRequestCard } from "@/components/requests/mobile/MobileRequestCard";
import { MobileRequestForm } from "@/components/mobile/MobileRequestForm";
import { Progress } from "@/components/ui/progress";

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
  ordered: { icon: Package, label: "Ordered", progress: 25 },
  received: { icon: Truck, label: "Received", progress: 75 },
  ready_for_pickup: { icon: Key, label: "Ready for Pickup", progress: 100 },
  delivered: { icon: CheckCircle, label: "Delivered", progress: 100 }
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
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showMobileForm, setShowMobileForm] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const { data: requests = [], isLoading, refetch } = useKeyRequests(user?.id);
  const { data: orders = [] } = useKeyOrders(user?.id);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSubmitRequest = async (data: any) => {
    setShowRequestForm(false);
    setShowMobileForm(false);
    try {
      const { submitKeyRequest } = await import('@/services/supabase/keyRequestService');
      
      await submitKeyRequest({
        reason: data.reason,
        user_id: user!.id,
        request_type: data.request_type,
        room_id: data.room_id || null,
        room_other: data.room_other || null,
        quantity: data.quantity,
        emergency_contact: data.emergency_contact || null,
        email_notifications_enabled: data.email_notifications_enabled,
      });
      
      const { toast } = await import('sonner');
      toast.success('Key request submitted successfully!');
      refetch();
    } catch (error) {
      const { toast } = await import('sonner');
      toast.error('Failed to submit key request.');
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader title="My Requests" description="Track your key requests" />
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading your requests...</div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="My Requests" 
        description="Track and manage your key requests"
      >
        <Button onClick={() => isMobile ? setShowMobileForm(true) : setShowRequestForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
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

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No requests yet</h3>
            <p className="text-muted-foreground mb-4">
              You haven't submitted any key requests. Get started by creating your first request.
            </p>
            <Button onClick={() => isMobile ? setShowMobileForm(true) : setShowRequestForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {isMobile ? (
            // Mobile view with enhanced cards
            requests.map((request) => (
              <MobileRequestCard
                key={request.id}
                request={request}
                onViewDetails={() => {/* Handle view details */}}
                onCancel={() => {/* Handle cancel */}}
                onFollowUp={() => {/* Handle follow up */}}
                onResubmit={() => {/* Handle resubmit */}}
              />
            ))
          ) : (
            // Desktop view
            requests.map((request) => {
              const requestStatus = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
              const StatusIcon = requestStatus.icon;
              
              // Find related key order
              const relatedOrder = orders.find(order => 
                order.notes?.includes(request.id) || 
                (order.ordered_at && new Date(order.ordered_at) >= new Date(request.created_at || ''))
              );
              
              return (
                <Card key={request.id} className="transition-all hover:shadow-md">
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
                          <span className="text-sm text-muted-foreground">
                            {orderStatusConfig[relatedOrder.status as keyof typeof orderStatusConfig]?.label || relatedOrder.status}
                          </span>
                        </div>
                        <Progress 
                          value={orderStatusConfig[relatedOrder.status as keyof typeof orderStatusConfig]?.progress || 0} 
                          className="h-2"
                        />
                        {relatedOrder.status === 'ready_for_pickup' && (
                          <p className="text-sm text-green-600 mt-2 font-medium">
                            🎉 Your key is ready for pickup at the facilities office!
                          </p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                      <span>Submitted: {request.created_at ? format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a") : 'Unknown'}</span>
                      {request.updated_at && request.updated_at !== request.created_at && (
                        <span>Updated: {format(new Date(request.updated_at), "MMM d, yyyy")}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}
    </PageContainer>
  );
}