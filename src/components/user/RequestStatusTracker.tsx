import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Package, 
  Truck,
  MapPin,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { KeyRequest } from "@/hooks/useKeyRequests";

interface RequestStatusTrackerProps {
  request: KeyRequest;
  orderStatus?: string;
}

const requestStatuses = [
  { key: 'pending', label: 'Submitted', icon: Clock },
  { key: 'under_review', label: 'Under Review', icon: Clock },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'fulfilled', label: 'Fulfilled', icon: CheckCircle }
];

const orderStatuses = [
  { key: 'pending_fulfillment', label: 'Pending Fulfillment', icon: Clock },
  { key: 'in_progress', label: 'In Progress', icon: Package },
  { key: 'received', label: 'Received', icon: Package },
  { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: MapPin },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
  { key: 'cancelled', label: 'Cancelled', icon: XCircle },
];

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending':
      return { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock };
    case 'under_review':
      return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock };
    case 'approved':
      return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle };
    case 'rejected':
      return { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle };
    case 'cancelled':
      return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle };
    case 'fulfilled':
      return { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle };
    case 'ready_for_pickup':
      return { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle };
    default:
      return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock };
  }
};

const getProgressPercentage = (status: string, isOrder = false) => {
  const statuses = isOrder ? orderStatuses : requestStatuses;
  const index = statuses.findIndex(s => s.key === status);
  return index >= 0 ? ((index + 1) / statuses.length) * 100 : 0;
};

export function RequestStatusTracker({ request, orderStatus }: RequestStatusTrackerProps) {
  const statusConfig = getStatusConfig(request.status || 'pending');
  const StatusIcon = statusConfig.icon;
  
  const isApproved = request.status === 'approved' || request.status === 'fulfilled';
  const isRejected = request.status === 'rejected';
  const isCancelled = request.status === 'cancelled';
  
  const showOrderTracking = isApproved && orderStatus;
  
  const requestProgress = getProgressPercentage(request.status || 'pending');
  const orderProgress = orderStatus ? getProgressPercentage(orderStatus, true) : 0;

  const getRequestTypeLabel = (type: string): string => {
    switch (type) {
      case 'new': return 'New Key';
      case 'spare': return 'Spare Key';
      case 'replacement': return 'Replacement';
      default: return type;
    }
  };

  const getNextStep = () => {
    if (isRejected) return "Request was rejected";
    if (isCancelled) return "Request was cancelled";
    if (request.status === 'fulfilled') return "Request completed";
    if (request.status === 'approved' && orderStatus) {
      switch (orderStatus) {
        case 'pending_fulfillment': return "Order is being processed";
        case 'in_progress': return "Order is in progress";
        case 'received': return "Keys have been received";
        case 'ready_for_pickup': return "Keys are ready for pickup at facilities office";
        case 'completed': return "Order completed";
        case 'cancelled': return "Order was cancelled";
        default: return "Processing order";
      }
    }
    if (request.status === 'approved') return "Order will be processed shortly";
    if (request.status === 'under_review') return "Request is being reviewed by admin";
    return "Waiting for admin review";
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">
              {getRequestTypeLabel(request.request_type)} Request
            </h3>
            <p className="text-sm text-muted-foreground">
              Submitted {request.created_at ? format(new Date(request.created_at), 'MMM d, yyyy') : 'Unknown'}
            </p>
          </div>
          <Badge className={statusConfig.color}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {request.status || 'pending'}
          </Badge>
        </div>

        {/* Request Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Request Status</span>
            <span className="text-sm text-muted-foreground">{Math.round(requestProgress)}%</span>
          </div>
          <Progress value={requestProgress} className="h-2" />
          
          <div className="flex justify-between text-xs">
            {requestStatuses.map((status, index) => {
              const Icon = status.icon;
              const isActive = requestStatuses.findIndex(s => s.key === (request.status || 'pending')) >= index;
              return (
                <div key={status.key} className={`flex flex-col items-center ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  <Icon className="h-4 w-4 mb-1" />
                  <span className="text-xs">{status.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Progress (if applicable) */}
        {showOrderTracking && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Order Status</span>
              <span className="text-sm text-muted-foreground">{Math.round(orderProgress)}%</span>
            </div>
            <Progress value={orderProgress} className="h-2" />
            
            <div className="flex justify-between text-xs">
              {orderStatuses.map((status, index) => {
                const Icon = status.icon;
                const isActive = orderStatuses.findIndex(s => s.key === orderStatus) >= index;
                return (
                  <div key={status.key} className={`flex flex-col items-center ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    <Icon className="h-4 w-4 mb-1" />
                    <span className="text-xs">{status.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="bg-muted/50 p-4 rounded-md">
          <p className="text-sm">
            <span className="font-medium">Next Steps: </span>
            {getNextStep()}
          </p>
        </div>

        {/* Request Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Quantity:</span>
            <span>{request.quantity}</span>
          </div>
          {(request.room_other) && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Location:</span>
              <span>{request.room_other}</span>
            </div>
          )}
          {request.emergency_contact && (
            <div className="p-2 bg-destructive/10 rounded border border-destructive/20">
              <p className="text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 inline mr-1" />
                Emergency Contact: {request.emergency_contact}
              </p>
            </div>
          )}
        </div>

        {/* Rejection Reason */}
        {isRejected && request.rejection_reason && (
          <div className="bg-destructive/10 p-4 rounded-md border border-destructive/20">
            <p className="text-sm text-destructive">
              <span className="font-medium">Rejection Reason: </span>
              {request.rejection_reason}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}