import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Package, 
  User, 
  Calendar, 
  MapPin, 
  FileText, 
  Phone,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";

interface KeyOrderCardProps {
  order: any;
  onStatusUpdate: (orderId: string, newStatus: string, notes?: string) => void;
}

const statusConfig = {
  pending_fulfillment: { 
    label: "Pending Fulfillment", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock 
  },
  in_progress: { 
    label: "In Progress", 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Package 
  },
  ready_for_pickup: { 
    label: "Ready for Pickup", 
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle 
  },
  completed: { 
    label: "Completed", 
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: CheckCircle 
  },
  cancelled: { 
    label: "Cancelled", 
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertTriangle 
  },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 text-gray-800" },
  medium: { label: "Medium", color: "bg-blue-100 text-blue-800" },
  high: { label: "High", color: "bg-orange-100 text-orange-800" },
  urgent: { label: "Urgent", color: "bg-red-100 text-red-800" },
};

const getNextStatus = (currentStatus: string): string | null => {
  const statusFlow = {
    pending_fulfillment: 'in_progress',
    in_progress: 'ready_for_pickup',
    ready_for_pickup: 'completed',
  };
  return statusFlow[currentStatus as keyof typeof statusFlow] || null;
};

export const AdminKeyOrderCard = ({ order, onStatusUpdate }: KeyOrderCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateNotes, setUpdateNotes] = useState("");
  const [showDialog, setShowDialog] = useState(false);

  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending_fulfillment;
  const priorityInfo = priorityConfig[order.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const StatusIcon = statusInfo.icon;
  
  const userName = order.user_profiles 
    ? `${order.user_profiles.first_name || ''} ${order.user_profiles.last_name || ''}`.trim()
    : 'Unknown User';

  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  const nextStatus = getNextStatus(order.status);

  const handleStatusUpdate = async () => {
    if (!nextStatus) return;
    
    setIsUpdating(true);
    try {
      await onStatusUpdate(order.id, nextStatus, updateNotes || undefined);
      setUpdateNotes("");
      setShowDialog(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels = {
      new: "New Key",
      spare: "Spare Key", 
      replacement: "Replacement",
      temporary: "Temporary Access"
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Card className="transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarFallback className="bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{userName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {order.user_profiles?.email || 'No email'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={priorityInfo.color}>
              {priorityInfo.label}
            </Badge>
            <Badge className={statusInfo.color}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span>Qty: {order.quantity}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Ordered: {format(new Date(order.created_at), 'MMM dd, yyyy')}</span>
          </div>
          {order.key_requests && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{getRequestTypeLabel(order.key_requests.request_type)}</span>
            </div>
          )}
        </div>

        {/* Location Info */}
        {(order.rooms || order.key_requests?.room_other) && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {order.rooms 
                ? `${order.rooms.room_number} - ${order.rooms.name}`
                : order.key_requests?.room_other || 'Unknown location'
              }
            </span>
          </div>
        )}

        {/* Emergency Contact */}
        {order.key_requests?.emergency_contact && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-red-500" />
            <span className="text-red-600 font-medium">
              Emergency: {order.key_requests.emergency_contact}
            </span>
          </div>
        )}

        {/* Justification */}
        {order.key_requests?.justification && (
          <div className="text-sm">
            <p className="font-medium text-muted-foreground mb-1">Justification:</p>
            <p className="text-sm">{order.key_requests.justification}</p>
          </div>
        )}

        {/* Notes */}
        {order.notes && (
          <div className="text-sm">
            <p className="font-medium text-muted-foreground mb-1">Notes:</p>
            <p className="text-sm">{order.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-2">
          <div className="text-xs text-muted-foreground">
            Order #{order.id.slice(0, 8)}
          </div>
          
          {nextStatus && order.status !== 'completed' && order.status !== 'cancelled' && (
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  Advance to {statusConfig[nextStatus as keyof typeof statusConfig]?.label}
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Order Status</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p>
                    Change status from <Badge className={statusInfo.color}>{statusInfo.label}</Badge> to{' '}
                    <Badge className={statusConfig[nextStatus as keyof typeof statusConfig]?.color}>
                      {statusConfig[nextStatus as keyof typeof statusConfig]?.label}
                    </Badge>
                  </p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Notes (optional)</label>
                    <Textarea
                      placeholder="Add any notes about this status update..."
                      value={updateNotes}
                      onChange={(e) => setUpdateNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDialog(false)}
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleStatusUpdate}
                      disabled={isUpdating}
                    >
                      {isUpdating ? 'Updating...' : 'Update Status'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
};