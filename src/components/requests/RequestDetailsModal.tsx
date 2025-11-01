import { format } from "date-fns";
import { Clock, CheckCircle, XCircle, Package, Truck, Key, User, Calendar, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface KeyRequest {
  id: string;
  status: string;
  request_type: string;
  reason: string;
  quantity: number;
  room_other?: string;
  emergency_contact?: string;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
  rejection_reason?: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface KeyOrder {
  id: string;
  status: string;
  notes?: string;
  ordered_at?: string;
  received_at?: string;
  delivered_at?: string;
}

interface RequestDetailsModalProps {
  request: KeyRequest | null;
  order?: KeyOrder;
  open: boolean;
  onClose: () => void;
  onCancel?: () => void;
}

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

const getRequestTypeLabel = (type: string) => {
  switch (type) {
    case 'spare': return 'Spare Key';
    case 'replacement': return 'Replacement Key';
    case 'new': return 'New Access';
    default: return type;
  }
};

export function RequestDetailsModal({ request, order, open, onClose, onCancel }: RequestDetailsModalProps) {
  if (!request) return null;

  const requestStatus = statusConfig[request.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = requestStatus.icon;
  const canCancel = request.status === 'pending' && onCancel;

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
        return status || '';
    }
  };

  const normalizedOrderStatus = normalizeOrderStatus(order?.status);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            {getRequestTypeLabel(request.request_type)} Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Section */}
          <div className="flex items-center justify-between">
            <div>
              <Badge variant={requestStatus.variant} className="mb-2">
                {requestStatus.label}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {requestStatus.description}
              </p>
            </div>
            {canCancel && (
              <Button variant="outline" size="sm" onClick={onCancel}>
                Cancel Request
              </Button>
            )}
          </div>

          <Separator />

          {/* Request Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Reason</span>
                </div>
                <p className="text-sm bg-muted p-2 rounded">{request.reason || 'Not specified'}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Quantity</span>
                </div>
                <p className="text-sm">{request.quantity || 1} key(s)</p>
              </div>

              {request.room_other && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Room/Location</span>
                  </div>
                  <p className="text-sm">{request.room_other}</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Submitted</span>
                </div>
                <p className="text-sm">
                  {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>

              {request.updated_at && request.updated_at !== request.created_at && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Last Updated</span>
                  </div>
                  <p className="text-sm">
                    {format(new Date(request.updated_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              )}

              {request.emergency_contact && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Emergency Contact</span>
                  </div>
                  <p className="text-sm">{request.emergency_contact}</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Notes */}
          {(request.admin_notes || request.rejection_reason) && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-2">
                  {request.status === 'rejected' ? 'Rejection Reason' : 'Admin Notes'}
                </h4>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">{request.admin_notes || request.rejection_reason}</p>
                </div>
              </div>
            </>
          )}

          {/* Order Progress */}
          {request.status === 'approved' && order && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-4">Order Progress</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {orderStatusConfig[normalizedOrderStatus as keyof typeof orderStatusConfig]?.label || normalizedOrderStatus}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {orderStatusConfig[normalizedOrderStatus as keyof typeof orderStatusConfig]?.progress || 0}%
                    </span>
                  </div>
                  <Progress 
                    value={orderStatusConfig[normalizedOrderStatus as keyof typeof orderStatusConfig]?.progress || 0} 
                    className="h-2"
                  />
                  
                  {normalizedOrderStatus === 'ready_for_pickup' && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <p className="text-sm text-green-800 font-medium">
                        🎉 Your key is ready for pickup at the facilities office!
                      </p>
                    </div>
                  )}

                  {/* Order Timeline */}
                  <div className="space-y-2 mt-4">
                    <h5 className="text-sm font-medium text-muted-foreground">Timeline</h5>
                    <div className="space-y-1 text-sm">
                      {order.ordered_at && (
                        <div className="flex justify-between">
                          <span>Order Placed</span>
                          <span className="text-muted-foreground">
                            {format(new Date(order.ordered_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                      )}
                      {order.received_at && (
                        <div className="flex justify-between">
                          <span>Order Received</span>
                          <span className="text-muted-foreground">
                            {format(new Date(order.received_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                      )}
                      {order.delivered_at && (
                        <div className="flex justify-between">
                          <span>Order Completed</span>
                          <span className="text-muted-foreground">
                            {format(new Date(order.delivered_at), "MMM d, h:mm a")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}