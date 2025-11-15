import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Settings,
  Calendar,
  MapPin,
  MessageSquare,
  Eye,
  ArrowUpCircle
} from "lucide-react";
import { MobileCardView } from "@/components/mobile/MobileCardView";
import { format } from "date-fns";

interface Issue {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at?: string;
  buildings?: { name: string };
  rooms?: { name: string; room_number?: string };
  assigned_to?: string;
  category?: string;
  photos?: string[];
}

interface MobileIssueCardProps {
  issue: Issue;
  onViewDetails: () => void;
  onAddComment?: () => void;
  onFollowUp?: () => void;
  onEscalate?: () => void;
}

export function MobileIssueCard({
  issue,
  onViewDetails,
  onAddComment,
  onFollowUp,
  onEscalate
}: MobileIssueCardProps) {
  const getStatusConfig = (status: string) => {
    const configs = {
      open: { 
        icon: AlertCircle, 
        color: "bg-red-500/10 text-red-700 border-red-500/20", 
        label: "Open"
      },
      in_progress: { 
        icon: Settings, 
        color: "bg-blue-500/10 text-blue-700 border-blue-500/20", 
        label: "In Progress"
      },
      resolved: { 
        icon: CheckCircle, 
        color: "bg-green-500/10 text-green-700 border-green-500/20", 
        label: "Resolved"
      },
      closed: { 
        icon: CheckCircle, 
        color: "bg-gray-500/10 text-gray-700 border-gray-500/20", 
        label: "Closed"
      }
    };
    return configs[status as keyof typeof configs] || configs.open;
  };

  const getPriorityConfig = (priority: string) => {
    const configs = {
      low: { label: "Low Priority", variant: "outline" as const, color: "text-gray-600" },
      medium: { label: "Medium Priority", variant: "secondary" as const, color: "text-orange-600" },
      high: { label: "High Priority", variant: "destructive" as const, color: "text-red-600" },
      urgent: { label: "Urgent", variant: "destructive" as const, color: "text-red-700" }
    };
    return configs[priority as keyof typeof configs] || configs.medium;
  };

  const statusConfig = getStatusConfig(issue.status);
  const priorityConfig = getPriorityConfig(issue.priority);
  const StatusIcon = statusConfig.icon;

  const getTimelineBadge = () => {
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(issue.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceCreated === 0) return "Reported Today";
    if (daysSinceCreated === 1) return "Reported Yesterday";
    if (daysSinceCreated < 7) return `Reported ${daysSinceCreated} days ago`;
    if (daysSinceCreated < 30) return `Reported ${Math.floor(daysSinceCreated / 7)} weeks ago`;
    return `Reported ${Math.floor(daysSinceCreated / 30)} months ago`;
  };

  const getActionButtons = () => {
    const actions = [];
    
    if (onAddComment) {
      actions.push(
        <Button key="comment" size="sm" variant="outline" onClick={onAddComment}>
          <MessageSquare className="h-4 w-4 mr-1" />
          Comment
        </Button>
      );
    }
    
    if (issue.status === 'open' && onFollowUp) {
      actions.push(
        <Button key="followup" size="sm" variant="outline" onClick={onFollowUp}>
          <Eye className="h-4 w-4 mr-1" />
          Follow Up
        </Button>
      );
    }
    
    if (['open', 'in_progress'].includes(issue.status) && issue.priority !== 'urgent' && onEscalate) {
      actions.push(
        <Button key="escalate" size="sm" variant="outline" onClick={onEscalate}>
          <ArrowUpCircle className="h-4 w-4 mr-1" />
          Escalate
        </Button>
      );
    }

    return actions;
  };

  const getProgressPercentage = () => {
    switch (issue.status) {
      case 'open': return 25;
      case 'in_progress': return 75;
      case 'resolved': return 100;
      case 'closed': return 100;
      default: return 0;
    }
  };

  return (
    <MobileCardView
      title={issue.title}
      subtitle={issue.category || 'General Issue'}
      description={issue.description}
      status={{
        label: statusConfig.label,
        variant: issue.status === 'resolved' || issue.status === 'closed' ? 'default' :
                 issue.status === 'open' ? 'destructive' : 'secondary'
      }}
      badges={[
        {
          label: priorityConfig.label,
          variant: priorityConfig.variant
        },
        {
          label: getTimelineBadge(),
          variant: 'outline'
        }
      ]}
      onCardClick={onViewDetails}
      className="hover:shadow-md transition-shadow"
    >
      <div className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Resolution Progress</span>
            <span className="font-medium">{getProgressPercentage()}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                issue.status === 'resolved' || issue.status === 'closed' 
                  ? 'bg-green-500' 
                  : issue.status === 'in_progress' 
                  ? 'bg-blue-500' 
                  : 'bg-red-500'
              }`}
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>

        {/* Issue Details */}
        <div className="space-y-2">
          {(issue.buildings?.name || issue.rooms?.name) && (
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Location</p>
                <p className="text-muted-foreground">
                  {issue.buildings?.name && `${issue.buildings.name}`}
                  {issue.rooms?.name && ` - ${issue.rooms.name}`}
                  {issue.rooms?.room_number && ` (${issue.rooms.room_number})`}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Reported</p>
              <p className="text-muted-foreground">
                {format(new Date(issue.created_at), "MMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </div>

          {issue.assigned_to && (
            <div className="flex items-start gap-2">
              <Settings className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Assigned To</p>
                <p className="text-muted-foreground">{issue.assigned_to}</p>
              </div>
            </div>
          )}
        </div>

        {/* Status-specific information */}
        {issue.status === 'resolved' && (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-700">Issue Resolved</p>
            </div>
            <p className="text-xs text-green-600 mt-1">
              This issue has been marked as resolved. If the problem persists, you can follow up.
            </p>
          </div>
        )}

        {issue.status === 'in_progress' && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-700">Work in Progress</p>
            </div>
            <p className="text-xs text-blue-600 mt-1">
              Our team is actively working on resolving this issue.
            </p>
          </div>
        )}

        {issue.status === 'open' && issue.priority === 'urgent' && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-700">Urgent Priority</p>
            </div>
            <p className="text-xs text-red-600 mt-1">
              This issue is marked as urgent and will be prioritized for immediate attention.
            </p>
          </div>
        )}

        {issue.status === 'open' && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <p className="text-sm font-medium text-yellow-700">Awaiting Assignment</p>
            </div>
            <p className="text-xs text-yellow-600 mt-1">
              Your issue has been received and is waiting to be assigned to a team member.
            </p>
          </div>
        )}

        {/* Photos indicator */}
        {issue.photos && issue.photos.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            <span>{issue.photos.length} photo{issue.photos.length > 1 ? 's' : ''} attached</span>
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