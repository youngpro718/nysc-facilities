import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Clock, 
  User, 
  Key, 
  MapPin, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  History
} from "lucide-react";
import { format } from "date-fns";
import { KeyRequest } from "@/hooks/useKeyRequests";

interface AdminKeyRequestCardProps {
  request: KeyRequest & {
    profiles?: {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
    };
    rooms?: {
      room_number: string;
      name: string;
    };
  };
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewWorkflow: (id: string) => void;
}

const statusConfig = {
  pending: {
    label: 'Pending Review',
    color: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: User
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: XCircle
  },
  fulfilled: {
    label: 'Fulfilled',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    icon: CheckCircle
  }
};

const getRequestTypeLabel = (type: string): string => {
  switch (type) {
    case 'new': return 'New Key';
    case 'spare': return 'Spare Key';
    case 'replacement': return 'Replacement';
    default: return type;
  }
};

export function AdminKeyRequestCard({ 
  request, 
  onApprove, 
  onReject, 
  onViewWorkflow 
}: AdminKeyRequestCardProps) {
  const status = statusConfig[request.status || 'pending'];
  const StatusIcon = status.icon;
  
  const isPending = request.status === 'pending';
  const isUnderReview = request.status === 'under_review';
  const canModerate = isPending || isUnderReview;

  const userInitials = request.profiles 
    ? `${request.profiles.first_name?.[0] || ''}${request.profiles.last_name?.[0] || ''}`
    : 'U';

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">
                {request.profiles?.first_name} {request.profiles?.last_name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {request.profiles?.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={status.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
            {request.emergency_contact && (
              <Badge variant="destructive" className="text-xs">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Emergency
              </Badge>
            )}
          </div>
        </div>

        {/* Request Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <span>{getRequestTypeLabel(request.request_type)} ({request.quantity})</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {request.created_at 
                ? format(new Date(request.created_at), 'MMM d, yyyy')
                : 'Unknown'
              }
            </span>
          </div>

          {(request.rooms || request.room_other) && (
            <div className="flex items-center gap-2 col-span-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>
                {request.rooms 
                  ? `${request.rooms.room_number} - ${request.rooms.name}`
                  : request.room_other
                }
              </span>
            </div>
          )}
        </div>

        {/* Reason */}
        {request.reason && (
          <div className="bg-muted/50 p-3 rounded-md">
            <p className="text-sm">
              <span className="font-medium">Reason: </span>
              {request.reason}
            </p>
          </div>
        )}

        {/* Emergency Contact */}
        {request.emergency_contact && (
          <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20">
            <p className="text-sm text-destructive">
              <span className="font-medium">Emergency Contact: </span>
              {request.emergency_contact}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewWorkflow(request.id)}
            className="text-muted-foreground"
          >
            <History className="h-4 w-4 mr-2" />
            View Workflow
          </Button>

          {canModerate && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(request.id)}
                className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => onApprove(request.id)}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}