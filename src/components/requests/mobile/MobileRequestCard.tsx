import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Calendar,
  User,
  MessageSquare,
  ArrowRight,
  AlertCircle
} from "lucide-react";
import { MobileCardView } from "@/components/mobile/MobileCardView";
import { format } from "date-fns";

interface Request {
  id: string;
  key_id?: string;
  reason?: string;
  status: string;
  created_at: string;
  updated_at?: string;
  priority?: string;
  location?: string;
  approver?: string;
  notes?: string;
}

interface MobileRequestCardProps {
  request: Request;
  onViewDetails: () => void;
  onCancel?: () => void;
  onFollowUp?: () => void;
  onResubmit?: () => void;
}

export function MobileRequestCard({
  request,
  onViewDetails,
  onCancel,
  onFollowUp,
  onResubmit
}: MobileRequestCardProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      pending: { 
        icon: Clock, 
        color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20", 
        label: "Pending Review"
      },
      approved: { 
        icon: CheckCircle, 
        color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20", 
        label: "Approved"
      },
      rejected: { 
        icon: XCircle, 
        color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20", 
        label: "Rejected"
      },
      completed: { 
        icon: CheckCircle, 
        color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20", 
        label: "Completed"
      },
      in_progress: { 
        icon: Clock, 
        color: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20", 
        label: "In Progress"
      }
    };
    return configs[status as keyof typeof configs] || configs.pending;
  };

  const statusConfig = getStatusConfig(request.status);
  const StatusIcon = statusConfig.icon;

  const getTimelineBadge = () => {
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(request.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreated === 0) return "Today";
    if (daysSinceCreated === 1) return "Yesterday";
    if (daysSinceCreated < 7) return `${daysSinceCreated} days ago`;
    if (daysSinceCreated < 30) return `${Math.floor(daysSinceCreated / 7)} weeks ago`;
    return `${Math.floor(daysSinceCreated / 30)} months ago`;
  };

  const getActionButtons = () => {
    const actions = [];
    
    if (request.status === 'rejected' && onResubmit) {
      actions.push(
        <Button key="resubmit" size="sm" variant="outline" onClick={onResubmit}>
          <ArrowRight className="h-4 w-4 mr-1" />
          Resubmit
        </Button>
      );
    }
    
    if (request.status === 'pending' && onCancel) {
      actions.push(
        <Button key="cancel" size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      );
    }
    
    if (['pending', 'in_progress'].includes(request.status) && onFollowUp) {
      actions.push(
        <Button key="followup" size="sm" variant="outline" onClick={onFollowUp}>
          <MessageSquare className="h-4 w-4 mr-1" />
          Follow Up
        </Button>
      );
    }

    return actions;
  };

  return (
    <MobileCardView
      title={request.key_id || 'Key Request'}
      subtitle={request.location || 'Key Access Request'}
      description={request.reason}
      status={{
        label: statusConfig.label,
        variant: request.status === 'approved' || request.status === 'completed' ? 'default' :
                 request.status === 'rejected' ? 'destructive' : 'secondary'
      }}
      badges={[
        {
          label: getTimelineBadge(),
          variant: 'outline'
        }
      ]}
      onCardClick={onViewDetails}
      className="hover:shadow-md active:scale-[0.99] transition-all duration-200"
    >
      <div className="space-y-4">
        {/* Timeline Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Request Progress</span>
            <span className="font-medium">{statusConfig.label}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              {/* Timeline dots */}
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <div className={`w-8 h-0.5 ${
                ['approved', 'completed', 'in_progress'].includes(request.status) 
                  ? 'bg-primary' 
                  : 'bg-muted'
              }`}></div>
              <div className={`w-3 h-3 rounded-full ${
                ['approved', 'completed', 'in_progress'].includes(request.status) 
                  ? 'bg-primary' 
                  : 'bg-muted'
              }`}></div>
              <div className={`w-8 h-0.5 ${
                request.status === 'completed' ? 'bg-primary' : 'bg-muted'
              }`}></div>
              <div className={`w-3 h-3 rounded-full ${
                request.status === 'completed' ? 'bg-primary' : 'bg-muted'
              }`}></div>
            </div>
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Submitted</span>
            <span>Reviewed</span>
            <span>Completed</span>
          </div>
        </div>

        {/* Request Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {format(new Date(request.created_at), "MMM d, yyyy")}
            </span>
          </div>
          
          {request.approver && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">
                {request.approver}
              </span>
            </div>
          )}
        </div>

        {/* Status-specific information */}
        {request.status === 'rejected' && (
          <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Request Rejected</p>
            </div>
            {request.notes && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{request.notes}</p>
            )}
          </div>
        )}

        {request.status === 'approved' && (
          <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Request Approved</p>
            </div>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Your key access has been approved. Please contact the front desk to collect your key.
            </p>
          </div>
        )}

        {request.status === 'pending' && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Awaiting Review</p>
            </div>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              Your request is being reviewed. You'll be notified when there's an update.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        {getActionButtons().length > 0 && (
          <div className="flex gap-2 pt-2 border-t">
            {getActionButtons()}
          </div>
        )}
      </div>
    </MobileCardView>
  );
}