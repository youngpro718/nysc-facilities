import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
import { KeyOrder } from "@/components/keys/types/OrderTypes";

interface KeyOrderCardProps {
  order: KeyOrder;
  onStatusUpdate: (orderId: string, newStatus: string, notes?: string) => void;
  onReceiveKeys: (orderId: string, quantity: number) => Promise<void> | void;
}

const statusConfig = {
  pending_fulfillment: { 
    label: "Pending Fulfillment", 
    color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 border-yellow-200 dark:border-yellow-800",
    icon: Clock 
  },
  in_progress: { 
    label: "In Progress", 
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 border-blue-200 dark:border-blue-800",
    icon: Package 
  },
  received: {
    label: "Received",
    color: "bg-purple-100 dark:bg-purple-900/30 text-purple-800 border-purple-200 dark:border-purple-800",
    icon: Package
  },
  ready_for_pickup: { 
    label: "Ready for Pickup", 
    color: "bg-green-100 dark:bg-green-900/30 text-green-800 border-green-200 dark:border-green-800",
    icon: CheckCircle 
  },
  completed: { 
    label: "Completed", 
    color: "bg-gray-100 dark:bg-gray-800/30 text-gray-800 border-gray-200",
    icon: CheckCircle 
  },
  cancelled: { 
    label: "Cancelled", 
    color: "bg-red-100 dark:bg-red-900/30 text-red-800 border-red-200 dark:border-red-800",
    icon: AlertTriangle 
  },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-gray-100 dark:bg-gray-800/30 text-gray-800" },
  medium: { label: "Medium", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800" },
  high: { label: "High", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-800" },
  urgent: { label: "Urgent", color: "bg-red-100 dark:bg-red-900/30 text-red-800" },
};

const getNextStatus = (currentStatus: string): string | null => {
  const statusFlow = {
    pending_fulfillment: 'in_progress',
    in_progress: 'ready_for_pickup',
    received: 'ready_for_pickup',
    ready_for_pickup: 'completed',
  };
  return statusFlow[currentStatus as keyof typeof statusFlow] || null;
};

export const AdminKeyOrderCard = ({ order, onStatusUpdate, onReceiveKeys }: KeyOrderCardProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateNotes, setUpdateNotes] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);
  const [receiveQty, setReceiveQty] = useState(order.quantity);

  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending_fulfillment;
  const priorityInfo = priorityConfig[order.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  const StatusIcon = statusInfo.icon;
  
  const profile = (order as any)?.key_requests?.profiles;
  const userName = (profile?.first_name || '') || (profile?.last_name || '')
    ? `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()
    : profile?.email || 'Unknown User';

  const userInitials = userName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'U';

  const orderedDateStr = (order as any).ordered_at || (order as any).created_at;

  const nextStatus = getNextStatus(order.status);
  const canReceive = order.status === 'pending_fulfillment' || order.status === 'in_progress';

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

  const handleReceive = async () => {
    setIsUpdating(true);
    try {
      const qty = Math.max(1, Math.min(receiveQty || 1, order.quantity));
      await onReceiveKeys(order.id, qty);
      setShowReceiveDialog(false);
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
                {profile?.email || 'No email'}
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
            <span>
              Ordered: {orderedDateStr ? format(new Date(String(orderedDateStr)), 'MMM dd, yyyy') : 'N/A'}
            </span>
          </div>
          {order.request_type && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>{getRequestTypeLabel(order.request_type)}</span>
            </div>
          )}
        </div>

        {/* Request Reason */}
        {order.reason && (
          <div className="text-sm">
            <p className="font-medium text-muted-foreground mb-1">Reason:</p>
            <p className="text-sm">{order.reason}</p>
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
          
          <div className="flex items-center gap-2">
            {canReceive && (
              <Dialog open={showReceiveDialog} onOpenChange={setShowReceiveDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="gap-2">
                    Receive
                    <Package className="h-3 w-3" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Receive Keys</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Enter the quantity received for this order.</p>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Quantity</label>
                      <Input
                        type="number"
                        min={1}
                        max={order.quantity}
                        value={receiveQty}
                        onChange={(e) => setReceiveQty(Number(e.target.value))}
                      />
                      <p className="text-xs text-muted-foreground">Max: {order.quantity}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => setShowReceiveDialog(false)}
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleReceive} disabled={isUpdating}>
                        {isUpdating ? 'Receiving...' : 'Confirm'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}

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
        </div>
      </CardContent>
    </Card>
  );
};